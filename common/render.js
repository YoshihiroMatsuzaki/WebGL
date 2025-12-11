/// <reference path="math.js"/>
/// <reference path="model.js"/>

class _attributeVar {
	/**
	 * WebGLコンテキスト
	 * @type {WebGLRenderingContext}
	 */
	#gl;
	/**
	 * 頂点
	 * @type {GLuint}
	 */
	#vertex;

	/**
	 * @param {WebGLRenderingContext} gl
	 * @param {WebGLProgram} program
	 */
	constructor(gl, program) {
		this.#gl = gl;
		this.#vertex = gl.getAttribLocation(program, "vertex");
	}

	/**
	 * VBO/IBOをバインド
	 * @param {_modelAttr} modelAttr
	 */
	bindBuffer(modelAttr) {
		this.#bindVbo(modelAttr.ver, this.#vertex, WebGLRenderingContext.FLOAT, 3);
		this.#gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, modelAttr.idx);
	}

	/**
	 * VBO/IBOを生成
	 * @param {Model} model
	 * @returns {_modelAttr}
	 */
	createBuffer(model) {
		let attr = new _modelAttr();
		attr.ver = this.#createVbo(model.ver);
		attr.idx = this.#createIbo(model.idx);
		attr.grp = [];
		for (let i=0; i<model.grp.length; i++) {
			attr.grp.push(model.grp[i]);
		}
		return attr;
	}

	/**
	 * VBO/IBOを削除
	 * @param {_modelAttr} modelAttr
	 */
	removeBuffer(modelAttr) {
		this.#gl.deleteBuffer(modelAttr.ver);
		this.#gl.deleteBuffer(modelAttr.idx);
	}

	/**
	 * VBOをバインド
	 * @param {WebGLBuffer} vbo
	 * @param {GLuint} location
	 * @param {GLenum} type
	 * @param {GLint} size
	 */
	#bindVbo(vbo, location, type, size) {
		this.#gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, vbo);
		this.#gl.enableVertexAttribArray(location);
		this.#gl.vertexAttribPointer(location, size, type, false, 0, 0);
	}

	/**
	 * VBOを生成
	 * @param {number[]} data
	 */
	#createVbo(data) {
		let vbo = this.#gl.createBuffer();
		let array = new Float32Array(data);
		this.#gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, vbo);
		this.#gl.bufferData(WebGLRenderingContext.ARRAY_BUFFER, array, WebGLRenderingContext.STATIC_DRAW);
		this.#gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, null);
		return vbo;
	}

	/**
	 * IBOを生成
	 * @param {number[]} data
	 */
	#createIbo(data) {
		let ibo = this.#gl.createBuffer();
		let array = new Int16Array(data);
		this.#gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, ibo);
		this.#gl.bufferData(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, array, WebGLRenderingContext.STATIC_DRAW);
		this.#gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, null);
		return ibo;
	}
}

class _uniformVar {
	/**
	 * WebGLコンテキスト
	 * @type {WebGLRenderingContext}
	 */
	#gl;
	/**
	 * MVP行列
	 * @type {WebGLUniformLocation}
	 */
	#mvpMatrix;
	/**
	 * モデル行列
	 * @type {WebGLUniformLocation}
	 */
	#mMatrix;
	/**
	 * モデル逆行列
	 * @type {WebGLUniformLocation}
	 */
	#invMatrix;
	/**
	 * 視点
	 * @type {WebGLUniformLocation}
	 */
	#eyePosition;
	/**
	 * 光源位置
	 * @type {WebGLUniformLocation}
	 */
	#lightPosition;
	/**
	 * モデル反射光
	 * @type {WebGLUniformLocation}
	 */
	#kd;
	/**
	 * モデル環境光
	 * @type {WebGLUniformLocation}
	 */
	#ka;
	/**
	 * モデル鏡面反射光
	 * @type {WebGLUniformLocation}
	 */
	#ks;
	/**
	 * モデル鏡面反射強度
	 * @type {WebGLUniformLocation}
	 */
	#ns;
	/**
	 * モデル鏡面屈折率
	 * @type {WebGLUniformLocation}
	 */
	#ior;

	#matV = new mat4();
	#matVP = new mat4();
	#matMVP = new mat4();
	#matInvM = new mat4();

	/**
	 * @param {WebGLRenderingContext} gl
	 * @param {WebGLProgram} program
	 */
	constructor(gl, program) {
		this.#gl = gl;
		this.#mvpMatrix = gl.getUniformLocation(program, "mvpMatrix");
		this.#mMatrix = gl.getUniformLocation(program, "mMatrix");
		this.#invMatrix = gl.getUniformLocation(program, "invMatrix");
		this.#eyePosition = gl.getUniformLocation(program, "eyePosition");
		this.#lightPosition = gl.getUniformLocation(program, "lightPosition");
		this.#kd = gl.getUniformLocation(program, "kd");
		this.#ka = gl.getUniformLocation(program, "ka");
		this.#ks = gl.getUniformLocation(program, "ks");
		this.#ns = gl.getUniformLocation(program, "ns");
		this.#ior = gl.getUniformLocation(program, "ior");
	}

	/**
	 * モデルを描画
	 * @param {mat4} matM
	 * @param {Group} group
	 */
	drawModel(matM, group) {
		// uniformへ座標変換行列を登録
		this.#matMVP.setMul(this.#matVP, matM);
		this.#matInvM.setInverse(matM);
		this.#gl.uniformMatrix4fv(this.#mvpMatrix, false, this.#matMVP.Array);
		this.#gl.uniformMatrix4fv(this.#mMatrix, false, matM.Array);
		this.#gl.uniformMatrix4fv(this.#invMatrix, false, this.#matInvM.Array);
		// uniformへ色情報を登録
		this.#gl.uniform4fv(this.#kd, group.kd.array);
		this.#gl.uniform4fv(this.#ka, group.ka.array);
		this.#gl.uniform4fv(this.#ks, group.ks.array);
		this.#gl.uniform1f(this.#ns, group.ns);
		this.#gl.uniform1f(this.#ior, 3.0+Math.log10(1/group.ns)/3.0);
		// モデルを描画
		this.#gl.drawElements(WebGLRenderingContext.TRIANGLES, group.indexCount, WebGLRenderingContext.UNSIGNED_SHORT, group.indexOfs<<1);
	}

	/**
	 * カメラ設定を適用
	 * @param {mat4} matP
	 * @param {Cam} cam
	 */
	applyCamera(matP, cam) {
		// ビュー×プロジェクション座標変換行列
		this.#matV.setView(cam.azimuth, cam.tilte, cam.eye, cam.position);
		this.#matVP.setMul(matP, this.#matV);
		// uniformへ視線を登録
		this.#gl.uniform3fv(this.#eyePosition, cam.eye);
	}

	/**
	 * 光源設定を適用
	 * @param {number[]} position
	 */
	applyLight(position) {
		// uniformへ光源を登録
		this.#gl.uniform3fv(this.#lightPosition, position);
	}
}

class _modelAttr {
	/**
	 * 頂点
	 * @type {WebGLBuffer}
	 */
	ver;
	/**
	 * インデックス
	 * @type {WebGLBuffer}
	 */
	idx;
	/**
	 * グループ
	 * @type {Group[]}
	 */
	grp;
}

class Cam {
	/**
	 * 方位角
	 * @type {number}
	 */
	azimuth = 0;
	/**
	 * 傾き
	 * @type {number}
	 */
	tilte = 0;
	/**
	 * 視点
	 * @type {number[]}
	 */
	eye = [0, 0, 0];
	/**
	 * 位置
	 * @type {number[]}
	 */
	position = [0, 0, 0];
}

class Render {
	/** @type {HTMLCanvasElement} */
	#canvas;
	/**
	 * WebGLコンテキスト
	 * @type {WebGLRenderingContext}
	 */
	#gl;
	/**
	 * attribute変数
	 * @type {_attributeVar}
	 */
	#attributeVar;
	/**
	 * uniform変数
	 * @type {_uniformVar}
	 */
	#uniformVar;

	/**
	 * モデルリスト
	 * @type {Map<string, _modelAttr>}
	 */
	#modelList;
	/**
	 * バインド中モデル
	 * @type {_modelAttr}
	 */
	#bindingModel;
	/**
	 * プロジェクション行列
	 * @type {mat4}
	 */
	#matP;

	#offset = new vec3();
	#cursor = new vec3();
	#lastCursor = new vec3();
	#pressState = 0;
	#azimuth = 0;
	#elevation = Math.PI/6;
	#px = 0;
	#py = 0;

	get Azimuth() { return this.#azimuth; }
	get Elevation() { return this.#elevation; }
	get Position() { return [this.#px, this.#py, 0]; }

	static get #LEFT() { return 1; }
	static get #RIGHT() { return 2; }

	/**
	 * カメラ
	 * @type {Cam}
	 */
	cam;
	/**
	 * 光源の位置
	 * @type {number[]}
	 */
	lightPosition;

	get GroupCount() {
		if (null == this.#bindingModel) {
			return 0;
		} else {
			return this.#bindingModel.grp.length;
		}
	}

	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {number} width
	 * @param {number} height
	 * @param {string} vs
	 * @param {string} fs
	 */
	constructor(canvas, width, height, vs, fs) {
		this.#canvas = canvas;
		this.#canvas.width = width;
		this.#canvas.height = height;
		this.#offset = new vec3(width/2, height/2);

		let self = this;
		this.#canvas.addEventListener("mousemove", function(ev) {
			self.#setCursor(ev.offsetX, ev.offsetY);
		});
		this.#canvas.addEventListener("mousedown", function(ev) {
			switch (ev.button) {
			case 0:
				self.#pressState |= Render.#LEFT;
				break;
			case 2:
				self.#pressState |= Render.#RIGHT;
				break;
			}
		});
		this.#canvas.addEventListener("mouseup", function(ev) {
			switch (ev.button) {
			case 0:
				self.#pressState &= ~Render.#LEFT;
				break;
			case 2:
				self.#pressState &= ~Render.#RIGHT;
				break;
			}
		});
		this.#canvas.addEventListener("mouseleave", function(ev) {
			self.#pressState = 0;
		});

		this.#canvas.addEventListener("touchmove", function(ev) {
			ev.preventDefault();
			let rect = self.#canvas.getBoundingClientRect();
			let x = ev.changedTouches[0].pageX - rect.left;
			let y = ev.changedTouches[0].pageY - rect.top;
			self.#setCursor(x, y);
		});
		this.#canvas.addEventListener("touchstart", function(ev) {
			ev.preventDefault();
			self.#pressState |= Render.#LEFT;
		});
		this.#canvas.addEventListener("touchend", function(ev) {
			ev.preventDefault();
			self.#pressState &= ~Render.#LEFT;
		});

		this.#modelList = new Map();
		this.#bindingModel = null;
		this.#matP = new mat4();
		this.cam = new Cam();
		this.lightPosition = [0, 0, 0];

		this.#matP.setPerspective(45, 0.5, 500, width / height);

		this.#gl = this.#canvas.getContext("webgl");
		// 拡張機能を有効化する
		if(!this.#gl.getExtension('OES_standard_derivatives')){
			console.log('OES_standard_derivatives is not supported');
			return;
		}
		this.#gl.enable(WebGLRenderingContext.DEPTH_TEST);
		this.#gl.depthFunc(WebGLRenderingContext.LEQUAL);
		this.#gl.enable(WebGLRenderingContext.CULL_FACE);

		let v_shader = this.#createShader(vs, WebGLRenderingContext.VERTEX_SHADER);
		let f_shader = this.#createShader(fs, WebGLRenderingContext.FRAGMENT_SHADER);
		let program = this.#createProgram(v_shader, f_shader);
		this.#attributeVar = new _attributeVar(this.#gl, program);
		this.#uniformVar = new _uniformVar(this.#gl, program);
	}

	/**
	 * シェーダを生成
	 * @param {string} source
	 * @param {GLenum} type
	 * @returns {WebGLShader}
	 */
	#createShader(source, type) {
		let shader = this.#gl.createShader(type);
		this.#gl.shaderSource(shader, source);
		this.#gl.compileShader(shader);
		if (this.#gl.getShaderParameter(shader, WebGLRenderingContext.COMPILE_STATUS)) {
			return shader;
		} else {
			alert(this.#gl.getShaderInfoLog(shader));
			return null;
		}
	}

	/**
	 * プログラムオブジェクトを生成しシェーダをリンク
	 * @param  {...WebGLShader} shaders
	 * @returns {WebGLProgram}
	 */
	#createProgram(...shaders) {
		let program = this.#gl.createProgram();
		for (let i in shaders) {
			this.#gl.attachShader(program, shaders[i]);
		}
		this.#gl.linkProgram(program);
		if (this.#gl.getProgramParameter(program, WebGLRenderingContext.LINK_STATUS)) {
			this.#gl.useProgram(program);
			return program;
		} else {
			alert(this.#gl.getProgramInfoLog(program));
			return null;
		}
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	#setCursor(x, y) {
		this.#cursor.x = x - this.#offset.x;
		this.#cursor.y = this.#offset.y - y;
	}

	/**
	 * モデルを追加
	 * @param {...Model} models
	 */
	addModels(...models) {
		for (let i=0; i<models.length; i++) {
			let model = models[i];
			let id = model.id;
			let attr;
			if (this.#modelList.has(id)) {
				attr = this.#modelList.get(id);
				this.#attributeVar.removeBuffer(attr);
			}
			attr = this.#attributeVar.createBuffer(model);
			this.#modelList.set(id, attr);
		}
	}

	/**
	 * モデルを削除
	 * @param  {...string} ids
	 */
	removeModels(...ids) {
		for (let i=0; i<ids.length; i++) {
			let id = ids[i];
			if (this.#modelList.has(id)) {
				let attr = this.#modelList.get(id);
				this.#attributeVar.removeBuffer(attr);
				this.#modelList.delete(id);
			}
		}
	}

	/**
	 * モデルをバインド
	 * @param {string} id
	 * @returns {boolean}
	 */
	bindModel(id) {
		if (this.#modelList.has(id)) {
			this.#bindingModel = this.#modelList.get(id);
			this.#attributeVar.bindBuffer(this.#bindingModel);
			return true;
		} else {
			this.#bindingModel = null;
			return false;
		}
	}

	/**
	 * モデル行列を設定して描画
	 * @param {mat4} matM
	 * @param {number} groupIndex
	 */
	drawModel(matM, groupIndex) {
		if (null == this.#bindingModel) {
			return;
		}
		let grp = this.#bindingModel.grp[groupIndex];
		if (grp.visible) {
			this.#uniformVar.drawModel(matM, grp);
		}
	}

	/**
	 * カメラ設定を適用
	 */
	applyCamera() {
		this.#uniformVar.applyCamera(this.#matP, this.cam);
	}

	/**
	 * 光源設定を適用
	 */
	applyLight() {
		this.#uniformVar.applyLight(this.lightPosition);
	}

	/**
	 * canvasを初期化
	 */
	clear() {
		this.#gl.clearColor(1.0, 1.0, 1.0, 1.0);
		this.#gl.clearDepth(1.0);
		this.#gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT);
		switch (this.#pressState) {
		case Render.#LEFT: {
			let dx = this.#cursor.x - this.#lastCursor.x;
			let dy = this.#cursor.y - this.#lastCursor.y;
			this.#azimuth += 4 * Math.PI * dx / this.#canvas.width;
			this.#elevation -= 2 * Math.PI * dy / this.#canvas.height;
			if (this.#elevation < -Math.PI/2) {
				this.#elevation = -Math.PI/2;
			} else if (this.#elevation > Math.PI/2) {
				this.#elevation = Math.PI/2;
			}
			break;
		}
		case Render.#LEFT | Render.#RIGHT: {
			let dx = this.#cursor.x - this.#lastCursor.x;
			let dy = this.#cursor.y - this.#lastCursor.y;
			this.#px += dx * 100 / this.#canvas.width;
			this.#py += dy * 100 / this.#canvas.height;
			break;
		}
		default:
			break;
		}
		this.#lastCursor.setFrom(this.#cursor);
	}

	/**
	 * コンテキストの再描画
	 */
	flush() {
		this.#gl.flush();
	}
}
