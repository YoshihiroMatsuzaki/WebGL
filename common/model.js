/// <reference path="math.js" />

class Color {
	static BLACK   = new Color(0.00, 0.00, 0.00);
	static GRAY25  = new Color(0.25, 0.25, 0.25);
	static GRAY33  = new Color(0.33, 0.33, 0.33);
	static GRAY50  = new Color(0.50, 0.50, 0.50);
	static GRAY66  = new Color(0.66, 0.66, 0.66);
	static GRAY75  = new Color(0.75, 0.75, 0.75);
	static WHITE   = new Color(1.00, 1.00, 1.00);
	static RED     = new Color(1.00, 0.00, 0.00);
	static GREEN   = new Color(0.00, 1.00, 0.00);
	static BLUE    = new Color(0.00, 0.00, 1.00);
	static MAGENTA = new Color(1.00, 0.00, 0.50);
	static YELLOW  = new Color(1.00, 1.00, 0.00);
	static CYAN    = new Color(0.00, 0.66, 1.00);

	#array = new Float32Array(4);

	get array() { return this.#array; }

	/**
	 * @param {number} r
	 * @param {number} g
	 * @param {number} b
	 * @param {number} a
	 */
	constructor(r=0, g=0, b=0, a=1) {
		this.#array[0] = r;
		this.#array[1] = g;
		this.#array[2] = b;
		this.#array[3] = a;
	}

	/**
	 * @param {Color} source
	 */
	copyFrom(source) {
		this.#array[0] = source.#array[0];
		this.#array[1] = source.#array[1];
		this.#array[2] = source.#array[2];
		this.#array[3] = source.#array[3];
	}

	/**
	 * @param {number} scale
	 * @returns {Color}
	 */
	light(scale) {
		return new Color(
			this.#array[0]*scale,
			this.#array[1]*scale,
			this.#array[2]*scale,
			this.#array[3]
		);
	}

	/**
	 * @param {number} alpha
	 * @returns {Color}
	 */
	transparent(alpha) {
		return new Color(
			this.#array[0],
			this.#array[1],
			this.#array[2],
			alpha
		);
	}
}

class Group {
	/** @type {string} */
	id;
	/** @type {number} */
	indexOfs;
	/** @type {number} */
	indexCount;
	/** @type {boolean} */
	visible;
	/** @type {string} */
	usemtl;
	/** @type {Color} */
	kd;
	/** @type {Color} */
	ka;
	/** @type {Color} */
	ks;
	/** @type {number} */
	ni;
	/** @type {number} */
	ns;

	/**
	 * @param {string} id
	 * @param {number} indexOfs
	 * @param {number} indexCount
	 */
	constructor(id="", indexOfs=0, indexCount=0) {
		this.id = id;
		this.indexOfs = indexOfs;
		this.indexCount = indexCount;
		this.visible = true;
		this.usemtl = "";
		this.kd = Color.GREEN;
		this.ka = Color.WHITE.light(0.1);
		this.ks = Color.WHITE;
		this.ni = 1.5;
		this.ns = 20;
	}

	/**
	 * @param {Group} source
	 */
	setFrom(source) {
		this.indexCount = source.indexCount;
		this.usemtl = source.usemtl;
		this.kd.copyFrom(source.kd);
		this.ka.copyFrom(source.ka);
		this.ks.copyFrom(source.ks);
		this.ni = source.ni;
		this.ns = source.ns;
	}

	/**
	 * @param {Mtl} source
	 */
	setFromMtl(source) {
		this.kd.copyFrom(source.kd);
		this.ka.copyFrom(source.ka);
		this.ks.copyFrom(source.ks);
		this.ni = source.ni;
		this.ns = source.ns;
	}
}

class Mtl {
	/** @type {string} */
	fileName;
	/** @type {string} */
	id;
	/** @type {Color} */
	kd;
	/** @type {Color} */
	ka;
	/** @type {Color} */
	ks;
	/** @type {number} */
	ni;
	/** @type {number} */
	ns;

	constructor(fileName="") {
		this.fileName = fileName;
		this.id = "";
		this.kd = Color.GREEN;
		this.ka = Color.WHITE.light(0.1);
		this.ks = Color.WHITE;
		this.ni = 1.5;
		this.ns = 20;
	}

	/**
	 * @param {Group} source
	 */
	setFromGroup(source) {
		this.id = source.usemtl;
		this.kd.copyFrom(source.kd);
		this.ka.copyFrom(source.ka);
		this.ks.copyFrom(source.ks);
		this.ni = source.ni;
		this.ns = source.ns;
	}
}

class Model {
	/** @type {string} */
	id;
	/** @type {number[]} */
	ver = [];
	/** @type {number[]} */
	idx = [];
	/** @type {Group[]} */
	grp = [];
	/** @type {Mtl[]} */
	mtl = [];

	constructor(id="") {
		this.id = id;
	}

	/**
	 * @param {string} fileName
	 * @param {string} text
	 */
	loadFile(fileName, text) {
		if (fileName.indexOf(".obj") >= 0) {
			this.#loadObj(fileName, text);
		}
		if (fileName.indexOf(".mtl") >= 0) {
			this.#loadMtl(fileName, text);
		}
		for (let i=0; i<this.grp.length; i++) {
			let g = this.grp[i];
			for (let j=0; j<this.mtl.length; j++) {
				let m = this.mtl[j];
				if (m.id == g.usemtl) {
					g.setFromMtl(m);
					break;
				} 
			}
		}
	}

	/**
	 * @returns {ArrayBuffer}
	 */
	createStl() {
		let grp = this.grp;
		let faceCount = 0;
		for (let i=0; i<grp.length; i++) {
			let g = grp[i];
			faceCount += g.indexCount / 3;
		}

		let pos = 80;
		let buffer = new ArrayBuffer(
			pos + 4
			+ (4*3*4 + 2) * faceCount
		);
		let dv = new DataView(buffer);

		dv.setUint32(pos, faceCount, true);
		pos += 4;

		let a = new vec3();
		let b = new vec3();
		let o = new vec3();
		let oa = new vec3();
		let ob = new vec3();
		let n = new vec3();
		let idx = this.idx;
		let ver = this.ver;
		for (let j=0; j<grp.length; j++) {
			let g = grp[j];
			for (let i=g.indexOfs,c=0; c<g.indexCount; i+=3,c+=3) {
				let ia = idx[i]*3;
				let io = idx[i+1]*3;
				let ib = idx[i+2]*3;
				a.x = ver[ia], a.y = ver[ia+1], a.z = ver[ia+2];
				o.x = ver[io], o.y = ver[io+1], o.z = ver[io+2];
				b.x = ver[ib], b.y = ver[ib+1], b.z = ver[ib+2];
				oa.sub(a, o);
				ob.sub(b, o);
				n.cross(oa, ob);
				n.normalize();

				dv.setFloat32(pos, n.x, true);
				pos += 4;
				dv.setFloat32(pos, n.z, true);
				pos += 4;
				dv.setFloat32(pos, n.y, true);
				pos += 4;

				dv.setFloat32(pos, a.x, true);
				pos += 4;
				dv.setFloat32(pos, a.z, true);
				pos += 4;
				dv.setFloat32(pos, a.y, true);
				pos += 4;

				dv.setFloat32(pos, o.x, true);
				pos += 4;
				dv.setFloat32(pos, o.z, true);
				pos += 4;
				dv.setFloat32(pos, o.y, true);
				pos += 4;

				dv.setFloat32(pos, b.x, true);
				pos += 4;
				dv.setFloat32(pos, b.z, true);
				pos += 4;
				dv.setFloat32(pos, b.y, true);
				pos += 4;

				dv.setUint16(pos, 0);
				pos += 2;
			}
		}
		return buffer;
	}

	/**
	 * @param {string} mtlFileName 
	 * @returns {string}
	 */
	createObj(mtlFileName) {
		let ver = this.ver;
		let idx = this.idx;
		let grp = this.grp;
		let str = "mtllib " + mtlFileName + "\r\n";
		for (let i=0; i<ver.length; i+=3) {
			let x = ver[i];
			let y = ver[i+1];
			let z = ver[i+2];
			str += "v " + x.toExponential(3) + " " + y.toExponential(3) + " " + z.toExponential(3) + "\r\n";
		}
		for (let j=0; j<grp.length; j++) {
			let g = grp[j];
			str += "g '" + g.id + "'\r\n";
			str += "usemtl '" + g.usemtl + "'\r\n";
			for (let i=g.indexOfs,c=0; c<g.indexCount; i+=3,c+=3) {
				let a = idx[i] + 1;
				let o = idx[i+1] + 1;
				let b = idx[i+2] + 1;
				str += "f " + a + " "+ o + " " + b + "\r\n";
			}
		}
		return str;
	}

	/**
	 * @returns {string}
	 */
	createMtl() {
		let str = "";
		let mtls = this.mtl;
		for (let i=0; i<mtls.length; i++) {
			let mtl = mtls[i];
			str += "newmtl '" + mtl.id + "'\r\n";
			str += "Kd " + mtl.kd.r.toFixed(2) + " " + mtl.kd.g.toFixed(2) + " " + mtl.kd.b.toFixed(2) + "\r\n";
			str += "Ka " + mtl.ka.r.toFixed(2) + " " + mtl.ka.g.toFixed(2) + " " + mtl.ka.b.toFixed(2) + "\r\n";
			str += "Ks " + mtl.ks.r.toFixed(2) + " " + mtl.ks.g.toFixed(2) + " " + mtl.ks.b.toFixed(2) + "\r\n";
			str += "Ni " + mtl.ni + "\r\n";
			str += "Ns " + mtl.ns + "\r\n";
			str += "\r\n";
		}
		return str;
	}

	/**
	 * @param {string} objFileName
	 * @param {string} mtlFileName
	 * @param  {Model[]} modelList
	 * @returns {Model}
	 */
	static marge(objFileName, mtlFileName, modelList) {
		let dst = new Model(objFileName);
		let dstVer = dst.ver;
		let dstIdx = dst.idx;
		let dstGrp = dst.grp;
		let dstMtl = dst.mtl;
		let indexOfs = 0;
		for (let i=0; i<modelList.length; i++) {
			let src = modelList[i];
			let srcVer = src.ver;
			for (let j=0; j<srcVer.length; j++) {
				dstVer.push(srcVer[j]);
			}
			let srcIdx = src.idx;
			let srcGrp = src.grp;
			for (let j=0; j<srcGrp.length; j++) {
				let srcGroup = srcGrp[j];
				let dstGroup = new Group(srcGroup.id, dstIdx.length);
				dstGroup.setFrom(srcGroup);
				dstGrp.push(dstGroup);
				for (let ix=srcGroup.indexOfs,c=0; c<srcGroup.indexCount; ix+=3,c+=3) {
					dstIdx.push(
						indexOfs + srcIdx[ix],
						indexOfs + srcIdx[ix+1],
						indexOfs + srcIdx[ix+2],
					);
				}
				let mtl = new Mtl(mtlFileName);
				mtl.setFromGroup(srcGroup);
				dstMtl.push(mtl);
			}
			indexOfs += srcVer.length / 3;
		}
		return dst;
	}

	/**
	 * @param {string} fileName
	 * @param {string} text
	 */
	#loadObj(fileName, text) {
		let lines = text
			.replace(/\r\n/g, "\n")
			.replace(/\r/g, "\n")
			.split("\n");
		this.id = fileName;
		let usemtl = "";
		/** @type {Group} */
		let grp = null;
		for (let i=0; i<lines.length; i++) {
			let line = lines[i];
			let cols = line.split(" ");
			switch (cols[0]) {
			case "usemtl":
				usemtl = cols[1];
				break;
			case "v":
				this.ver.push(cols[1]*1, cols[2]*1, cols[3]*1);
				break;
			case "g":
				grp = new Group(cols[1], this.idx.length);
				this.grp.push(grp);
				break;
			case "f":
				if (grp == null) {
					grp = new Group();
					this.grp.push(grp);
				}
				grp.usemtl = usemtl;
				this.#toTriangle(grp, cols);
				break;
			}
		}
	}

	/**
	 * @param {string} fileName
	 * @param {string} text
	 */
	#loadMtl(fileName, text) {
		let lines = text
			.replace(/\r\n/g, "\n")
			.replace(/\r/g, "\n")
			.split("\n");
		/** @type {Mtl} */
		let mtl = null;
		for (let i=0; i<lines.length; i++) {
			let line = lines[i];
			let cols = line.split(" ");
			switch (cols[0]) {
			case "newmtl":
				mtl = new Mtl(fileName);
				mtl.id = cols[1];
				this.mtl.push(mtl);
				break;
			case "Kd":
				mtl.kd = new Color(cols[1]*1, cols[2]*1, cols[3]*1);
				break;
			case "Ka":
				mtl.ka = new Color(cols[1]*1, cols[2]*1, cols[3]*1);
				break;
			case "Ks":
				mtl.ks = new Color(cols[1]*1, cols[2]*1, cols[3]*1);
				break;
			case "Ni":
				mtl.ni = cols[1]*1;
				break;
			case "Ns":
				mtl.ns = cols[1]*1;
				break;
			}
		}
	}

	/**
	 * @param {Group} grp
	 * @param {string[]} cols
	 */
	#toTriangle(grp, cols) {
		const N = cols.length - 1;
		const NH = N >>> 1;
		for (let i = 1; i < NH; i++) {
			let bl = cols[i].split("/")[0] - 1;
			let br = cols[i + 1].split("/")[0] - 1;
			let tr = cols[N - i].split("/")[0] - 1;
			let tl = cols[N - i + 1].split("/")[0] - 1;
			this.idx.push(tl, bl, br);
			this.idx.push(br, tr, tl);
			grp.indexCount += 6;
		}
		if (N%2 != 0) {
			let br = cols[NH].split("/")[0] - 1;
			let tr = cols[NH+1].split("/")[0] - 1;
			let tl = cols[NH+2].split("/")[0] - 1;
			this.idx.push(br, tr, tl);
			grp.indexCount += 3;
		}
	}
}
