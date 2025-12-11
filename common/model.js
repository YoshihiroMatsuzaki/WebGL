/// <reference path="drawer.js" />

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
		this.ns = 20;
	}

	/**
	 * @param {Group} src
	 */
	setFrom(src) {
		this.indexCount = src.indexCount;
		this.usemtl = src.usemtl;
		this.kd.setFrom(src.kd);
		this.ka.setFrom(src.ka);
		this.ks.setFrom(src.ks);
		this.ns = src.ns;
	}

	/**
	 * @param {Mtl} src
	 */
	setFromMtl(src) {
		this.kd.setFrom(src.kd);
		this.ka.setFrom(src.ka);
		this.ks.setFrom(src.ks);
		this.ns = src.ns;
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
	ns;

	constructor(fileName="") {
		this.fileName = fileName;
		this.id = "";
		this.kd = Color.GREEN;
		this.ka = Color.WHITE.light(0.1);
		this.ks = Color.WHITE;
		this.ns = 20;
	}

	/**
	 * @param {Group} src
	 */
	setFromGroup(src) {
		this.id = src.usemtl;
		this.kd.setFrom(src.kd);
		this.ka.setFrom(src.ka);
		this.ks.setFrom(src.ks);
		this.ns = src.ns;
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
	 * @param {string} objName
	 * @param {string} mtlName
	 * @param  {Model[]} modelList
	 * @returns {Model}
	 */
	static marge(objName, mtlName, modelList) {
		let ret = new Model(objName);
		let retVer = ret.ver;
		let retIdx = ret.idx;
		let retGrp = ret.grp;
		let retMtl = ret.mtl;
		let modelOfs = 0;
		for (let i=0; i<modelList.length; i++) {
			let model = modelList[i];
			let modelVer = model.ver;
			for (let j=0; j<modelVer.length; j++) {
				retVer.push(modelVer[j]);
			}
			let modelIdx = model.idx;
			let modelGrp = model.grp;
			for (let j=0; j<modelGrp.length; j++) {
				let modelGroup = modelGrp[j];
				let retGroup = new Group(modelGroup.id, retIdx.length);
				retGroup.setFrom(modelGroup);
				retGrp.push(retGroup);
				for (let ix=modelGroup.indexOfs,c=0; c<modelGroup.indexCount; ix+=3,c+=3) {
					retIdx.push(
						modelOfs + modelIdx[ix],
						modelOfs + modelIdx[ix+1],
						modelOfs + modelIdx[ix+2],
					);
				}
				let mtl = new Mtl(mtlName);
				mtl.setFromGroup(modelGroup);
				retMtl.push(mtl);
			}
			modelOfs += modelVer.length / 3;
		}
		return ret;
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
				mtl.kd.set(cols[1]*1, cols[2]*1, cols[3]*1);
				break;
			case "Ka":
				mtl.ka.set(cols[1]*1, cols[2]*1, cols[3]*1);
				break;
			case "Ks":
				mtl.ks.set(cols[1]*1, cols[2]*1, cols[3]*1);
				break;
			case "Ns":
				mtl.ns = cols[1]*1;
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
