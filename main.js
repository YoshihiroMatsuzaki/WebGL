/// <reference path="common/math.js"/>
/// <reference path="common/model.js"/>
/// <reference path="common/render.js"/>
/// <reference path="draw.js"/>

const STL_NAME = "test.stl";
const OBJ_NAME = "test.obj";
const MTL_NAME = "test.mtl";

/** @type {HTMLInputElement} */
let gScale;
/** @type {Render} */
let gRender;
/** @type {Model} */
let gModel;

onload = function() {
	gScale = document.getElementById('scale');
	gScale.style.width = 320;
	gRender = new Render(
		document.getElementById("canvas"),
		1024, 768,
		document.getElementById("vs").innerHTML,
		document.getElementById("fs").innerHTML
	);
	gModel = Model.marge(OBJ_NAME, MTL_NAME, draw());
	gRender.addModels(gModel);
	document.getElementById("disp").innerHTML
		= "<a id='downloadStl' href='#' onclick='createStlFile()'>3Dプリンタ用ファイルを保存</a><br>"
		+ "<a id='downloadObj' href='#' onclick='createObjFile()'>objファイルを保存</a><br>"
		+ "<a id='downloadMtl' href='#' onclick='createMtlFile()'>mtlファイルを保存</a>";
	loop();
};

function loop() {
	gRender.clear();

	let s = gScale.value * 0.01;

	// カメラの位置カメラの姿勢
	const eyeR = 1e2;
	gRender.cam.eye = [
		0,
		eyeR*Math.sin(gRender.Elevation),
		eyeR*Math.cos(gRender.Elevation)
	];
	gRender.cam.position = gRender.Position;
	gRender.cam.azimuth = gRender.Azimuth;
	gRender.cam.tilte = 0;
	gRender.applyCamera();

	// 光源の位置
	const lightR = 1e6;
	const lightE = 0;
	gRender.lightPosition = [
		0,
		lightR*Math.cos(lightE),
		lightR*Math.sin(lightE)
	];
	gRender.applyLight();

	// 3dモデル描画
	if (gRender.bindModel(OBJ_NAME)) {
		let matModel = new mat4();
		matModel.set(
			s, 0, 0, 0,
			0, s, 0, 0,
			0, 0, s, 0,
			0, 0, 0, 1
		);
		for (let i=0; i<gRender.GroupCount; i++) {
			gRender.drawModel(matModel, i);
		}
	}

	gRender.flush();
	window.requestAnimationFrame(loop);
}

function createStlFile() {
	let grp = gModel.grp;
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

	let idx = gModel.idx;
	let ver = gModel.ver;
	for (let i=0; i<grp.length; i++) {
		let g = grp[i];
		for (let ix=g.indexOfs,c=0; c<g.indexCount; ix+=3,c+=3) {
			let ia = idx[ix]*3;
			let io = idx[ix+1]*3;
			let ib = idx[ix+2]*3;
			let a = new vec3(ver[ia], ver[ia+1],ver[ia+2]);
			let o = new vec3(ver[io], ver[io+1],ver[io+2]);
			let b = new vec3(ver[ib], ver[ib+1],ver[ib+2]);
			let oa = a.sub(o);
			let ob = b.sub(o);
			let n = oa.cross(ob);

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
	let blob = new Blob([ buffer ], { "type" : "text/plain" });
	if (window.navigator.msSaveBlob) {
		window.navigator.msSaveBlob(blob, STL_NAME);
		window.navigator.msSaveOrOpenBlob(blob, STL_NAME);
	} else {
		document.getElementById("downloadStl").href = window.URL.createObjectURL(blob);
		document.getElementById("downloadStl").download = STL_NAME;
	}
}

function createObjFile() {
	let ver = gModel.ver;
	let idx = gModel.idx;
	let grp = gModel.grp;
	let str = "mtllib " + MTL_NAME + "\r\n";
	for (let ix=0; ix<ver.length; ix+=3) {
		let x = ver[ix];
		let y = ver[ix+1];
		let z = ver[ix+2];
		str += "v " + x.toExponential(3) + " " + y.toExponential(3) + " " + z.toExponential(3) + "\r\n";
	}
	for (let i=0; i<grp.length; i++) {
		let g = grp[i];
		str += "g '" + g.id + "'\r\n";
		str += "usemtl '" + g.usemtl + "'\r\n";
		for (let ix=g.indexOfs,c=0; c<g.indexCount; ix+=3,c+=3) {
			let a = idx[ix] + 1;
			let o = idx[ix+1] + 1;
			let b = idx[ix+2] + 1;
			str += "f " + a + " "+ o + " " + b + "\r\n";
		}
	}
	let blob = new Blob([ str ], { "type" : "text/plain" });
	if (window.navigator.msSaveBlob) {
		window.navigator.msSaveBlob(blob, OBJ_NAME);
		window.navigator.msSaveOrOpenBlob(blob, OBJ_NAME);
	} else {
		document.getElementById("downloadObj").href = window.URL.createObjectURL(blob);
		document.getElementById("downloadObj").download = OBJ_NAME;
	}
}

function createMtlFile() {
	let mtl = gModel.mtl;
	let str = "";
	for (let i=0; i<mtl.length; i++) {
		let m = mtl[i];
		str += "newmtl '" + m.id + "'\r\n";
		str += "Kd " + m.kd.r.toFixed(2) + " " + m.kd.g.toFixed(2) + " " + m.kd.b.toFixed(2) + "\r\n";
		str += "Ka " + m.ka.r.toFixed(2) + " " + m.ka.g.toFixed(2) + " " + m.ka.b.toFixed(2) + "\r\n";
		str += "Ks " + m.ks.r.toFixed(2) + " " + m.ks.g.toFixed(2) + " " + m.ks.b.toFixed(2) + "\r\n";
		str += "Ns " + m.ns + "\r\n";
		str += "\r\n";
	}
	let blob = new Blob([ str ], { "type" : "text/plain" });
	if (window.navigator.msSaveBlob) {
		window.navigator.msSaveBlob(blob, MTL_NAME);
		window.navigator.msSaveOrOpenBlob(blob, MTL_NAME);
	} else {
		document.getElementById("downloadMtl").href = window.URL.createObjectURL(blob);
		document.getElementById("downloadMtl").download = MTL_NAME;
	}
}
