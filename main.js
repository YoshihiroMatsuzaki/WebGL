/// <reference path="common/math.js"/>
/// <reference path="common/model.js"/>
/// <reference path="common/render.js"/>
/// <reference path="draw.js"/>

const STL_NAME = "test.stl";
const OBJ_NAME = "test.obj";
const MTL_NAME = "test.mtl";

/** @type {Render} */
let gRender;
/** @type {Model} */
let gModel;
let gUpdateModel = false;

onload = function() {
	gRender = new Render("canvas", 600, 600);
	createUI();
	gModel = Model.marge(OBJ_NAME, MTL_NAME, draw());
	gRender.addModels(gModel);
	document.getElementById("dispFiles").innerHTML
		= "<a id='downloadStl' href='#' onclick='createStlFile()'>3Dプリンタ用ファイルを保存</a><br>"
		+ "<a id='downloadObj' href='#' onclick='createObjFile()'>objファイルを保存</a><br>"
		+ "<a id='downloadMtl' href='#' onclick='createMtlFile()'>mtlファイルを保存</a>";
	loop();
};

function loop() {
	gRender.clear();

	// カメラの位置カメラの姿勢
	const eyeR = 1e2;
	gRender.cam.eye = [
		eyeR*Math.cos(gRender.Elevation)*Math.cos(gRender.Azimuth),
		eyeR*Math.sin(gRender.Elevation),
		eyeR*Math.cos(gRender.Elevation)*Math.sin(gRender.Azimuth)
	];
	gRender.cam.up = [
		0, 1, 0
	];
	gRender.cam.position = gRender.Position;
	gRender.applyCamera();

	// 光源の位置
	gRender.lightPosition = [0,1e6,0];
	gRender.applyLight();

	if (gUpdateModel) {
		gUpdateModel = false;
		gModel = Model.marge(OBJ_NAME, MTL_NAME, draw());
		gRender.addModels(gModel);
	}

	// 3dモデル描画
	if (gRender.bindModel(OBJ_NAME)) {
		let s = gRender.Scale;
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

/**
 * @param {string} id
 * @param {string} title
 * @param {number} value
 * @returns {string}
 */
function createTextBox(id, title, value) {
	return "<input id='" + id + "' value='" + value + "' type='text' style='width:40px;text-align:right;' onchange='gUpdateModel=true;'/>"
		+ "<span>" + title + "</span><br>";
}

/**
 * @param {string} id
 * @param {string} title
 * @param {string} group
 * @param {boolean} checked
 * @returns {string}
 */
function createRadioButton(id, title, group, checked) {
	return "<input id='" + id + "' name='" + group + "' " + (checked ? "checked" : "") + " type='radio' onchange='gUpdateModel=true;'/>"
		+ "<span onclick='document.getElementById(\"" + id + "\").checked=true;gUpdateModel=true;'>" + title + "</span>";
}

/**
 * @param {string} id
 * @returns {number}
 */
function getTextBoxValue(id) {
	return document.getElementById(id).value * 1;
}

/**
 * @param {string} id
 * @returns {boolean}
 */
function getRadioButtonChecked(id) {
	return document.getElementById(id).checked;
}

function createStlFile() {
	let data = gModel.createStl();
	let blob = new Blob([ data ], { "type" : "text/plain" });
	if (window.navigator.msSaveBlob) {
		window.navigator.msSaveBlob(blob, STL_NAME);
		window.navigator.msSaveOrOpenBlob(blob, STL_NAME);
	} else {
		document.getElementById("downloadStl").href = window.URL.createObjectURL(blob);
		document.getElementById("downloadStl").download = STL_NAME;
	}
}

function createObjFile() {
	let data = gModel.createObj(MTL_NAME);
	let blob = new Blob([ data ], { "type" : "text/plain" });
	if (window.navigator.msSaveBlob) {
		window.navigator.msSaveBlob(blob, OBJ_NAME);
		window.navigator.msSaveOrOpenBlob(blob, OBJ_NAME);
	} else {
		document.getElementById("downloadObj").href = window.URL.createObjectURL(blob);
		document.getElementById("downloadObj").download = OBJ_NAME;
	}
}

function createMtlFile() {
	let data = gModel.createMtl();
	let blob = new Blob([ data ], { "type" : "text/plain" });
	if (window.navigator.msSaveBlob) {
		window.navigator.msSaveBlob(blob, MTL_NAME);
		window.navigator.msSaveOrOpenBlob(blob, MTL_NAME);
	} else {
		document.getElementById("downloadMtl").href = window.URL.createObjectURL(blob);
		document.getElementById("downloadMtl").download = MTL_NAME;
	}
}
