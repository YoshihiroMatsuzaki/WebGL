/// <reference path="common/math.js" />
/// <reference path="common/model.js" />
/// <reference path="common/geometry.js" />
/// <reference path="main.js" />

function createUI() {
	let str = "";
	str += createTextBox("baseW", "脚部分(幅)", 28);
	str += createTextBox("baseL", "脚部分(長さ)", 35);
	str += createTextBox("baseT", "脚部分(厚み)", 4);
	str += "<br>";
	str += createTextBox("spindleD", "モーターの回転軸を通す穴(直径)", 7.5);
	str += "<br>";
	str += createTextBox("holeW", "ねじを通す穴(幅)", 3.2);
	str += createTextBox("holeL", "ねじを通す穴(長さ)", 6);
	str += createTextBox("holeN", "ねじを通す穴の数", 4);
	str += createTextBox("holeR", "ねじを通す穴の中心から回転軸までの長さ", 9.1);
	str += createTextBox("holeA", "ねじを通す穴の配置角度", 45);
	str += "<br>";
	str += createTextBox("propellerD", "プロペラ(直径)", 135);
	str += createTextBox("propellerT", "プロペラ(厚み)", 16);
	str += createTextBox("propellerY", "プロペラの位置(高さ)", 25);
	str += "<br>";
	str += createTextBox("pillarN", "柱の数", 8);
	str += createTextBox("pillarD", "柱の断面(直径)", 3);
	str += createTextBox("ringD", "輪の断面(直径)", 4);
	str += "<br>";
	str += createTextBox("armN", "腕の数", 4);
	str += createTextBox("armA", "腕の配置角度", 0);
	str += createRadioButton("armB", "腕の肘(高さ)を脚と同じに", "arm", true) + "<br>";
	str += createRadioButton("armR", "腕の肘(高さ)を輪の下に", "arm", false) + "<br>";
	str += createRadioButton("armCustom", "腕の肘(高さ)を指定する", "arm", false);
	str += createTextBox("armS", "", 10);

	document.getElementById("dispSettings").innerHTML = str;
}

function draw() {
	/** @type {Model[]} */
	let modelList = [];

	let baseW = getTextBoxValue("baseW");
	let baseL = getTextBoxValue("baseL");
	let baseT = getTextBoxValue("baseT");

	let spindleD = getTextBoxValue("spindleD");

	let holeW = getTextBoxValue("holeW");
	let holeL = getTextBoxValue("holeL");
	let holeN = getTextBoxValue("holeN");
	let holeR = getTextBoxValue("holeR");
	let holeA = getTextBoxValue("holeA")*Math.PI/180;

	let propellerD = getTextBoxValue("propellerD");
	let propellerT = getTextBoxValue("propellerT");
	let propellerY = getTextBoxValue("propellerY");

	let pillarN = getTextBoxValue("pillarN");
	let pillarD = getTextBoxValue("pillarD");
	let ringD = getTextBoxValue("ringD");
	let ringDR = ringD/2;
	let ringR = propellerD/2 + ringDR;

	let armN = getTextBoxValue("armN");
	let armA = getTextBoxValue("armA")*Math.PI/180;
	let armY = getRadioButtonChecked("armB") ? ringDR
		: getRadioButtonChecked("armR") ? (propellerY-(propellerT+ringD)/2)
		: (getTextBoxValue("armS") + ringDR);
	let armX = propellerD/2;

	// 脚部分
	{
		let p = new Plate();

		//*** ベース ***//
		p.addCapsule(0, 0, baseW, baseL, 0, 48);

		//*** モーターの回転軸を通す穴 ***//
		p.addCircle(0, 0, spindleD, 48);

		//*** ねじを通す穴 ***//
		for (let i=0; i<holeN; i++) {
			let th = 2*Math.PI*i/holeN + holeA;
			let x = holeR * Math.cos(th);
			let y = holeR * Math.sin(th);
			p.addCapsule(x, y, holeW, holeL, th, 24);
		}

		modelList.push(p.createModel(0, baseT, "脚"));
	}

	// 輪部分
	{
		const DIV = 96;
		let c = new Cylinder(DIV, 24, true);
		c.addScaleAtTime(0, ringD, ringD);
		c.addScaleAtTime(1, ringD, ringD);
		let q = new qtn();
		for (let i=0; i<DIV; i++) {
			let th = 2*Math.PI*i/DIV;
			let x = ringR * Math.cos(th);
			let z = ringR * Math.sin(th);
			q.setRot([0,1,0], th);
			c.addRot(i, q);
			c.addPos(i, x, propellerY, z);
		}
		c.translate.y = -propellerT/2;
		modelList.push(c.createModel("輪"));
		c.translate.y = propellerT/2;
		modelList.push(c.createModel("輪"));
	}

	// 柱部分
	{
		let c = new Cylinder(2, 24, false, true, true);
		c.addScale(0, pillarD, pillarD);
		c.addScale(1, pillarD, pillarD);
		let q = new qtn();
		q.setRot([1,0,0], Math.PI/2);
		c.addRot(0, q);
		c.addRot(1, q);
		c.addPos(0, 0, propellerY-propellerT/2, 0);
		c.addPos(1, 0, propellerY+propellerT/2, 0);
		for (let i=0; i<pillarN; i++) {
			let th = 2*Math.PI*i/pillarN + armA;
			c.translate.x = ringR * Math.cos(th);
			c.translate.z = ringR * Math.sin(th);
			modelList.push(c.createModel("柱"));
		}
	}

	// 腕部分
	{
		const DIV = 12;
		const ROT_DIV = DIV-3;
		let c = new Cylinder(DIV, 24);
		c.addScale(0, baseT, baseT);
		c.addScale(1, ringD, ringD);
		c.addScale(DIV-1, ringD, ringD);

		let qy = new qtn();
		qy.setRot([0,1,0], -Math.PI/2);
		c.addRot(0, qy);
		let sx = armX - baseW/2;
		let sy = armY - baseT/2;
		let th = Math.atan2(sy, sx);
		let q = new qtn();
		q.setRot([0,0,1], -th);
		q.setMul(qy, q);
		c.addRot(1, q);
		q.setRot([0,0,1], -Math.PI/2);
		q.setMul(qy, q);
		c.addRot(DIV-2, q);
		c.addRot(DIV-1, q);

		c.addPos(0, baseW/2, baseT/2, 0);
		let cr = ringDR;
		let cx = armX;
		let cy = armY + ringDR;
		let begin = th - Math.PI/2;
		let sweep = Math.PI/2 - th;
		for (let i=1,t=0; i<=ROT_DIV; i++,t++) {
			let ph = sweep*t/ROT_DIV + begin;
			let x = cr * Math.cos(ph) + cx;
			let y = cr * Math.sin(ph) + cy;
			c.addPos(i, x, y, 0);
		}
		c.addPos(DIV-2, ringR, cy, 0);
		c.addPos(DIV-1, ringR, propellerY - propellerT/2, 0);

		for (let i=0; i<armN; i++) {
			c.rotation.setRot([0,1,0], 2*Math.PI*i/armN + armA);
			modelList.push(c.createModel("腕"));
		}
	}

	return modelList;
}
