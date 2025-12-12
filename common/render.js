/// <reference path="math.js" />
/// <reference path="model.js" />

const _VS = "attribute vec3 vertex;" +
	"uniform   mat4 mvpMatrix;" +
	"uniform   mat4 mMatrix;" +
	"varying   vec3 vVertex;" +
	"void main(void) {" +
	"	vVertex = (mMatrix * vec4(vertex, 1.0)).xyz;" +
	"	gl_Position = mvpMatrix * vec4(vertex, 1.0);" +
	"}";

const _FS = "#extension GL_OES_standard_derivatives : enable\r\n" +
	"precision mediump float;" +
	"varying vec3  vVertex;" +
	"uniform mat4  invMatrix;" +
	"uniform vec3  lightPosition;" +
	"uniform vec3  eyePosition;" +
	"uniform vec4  kd;" +
	"uniform vec4  ka;" +
	"uniform vec4  ks;" +
	"uniform float ni;" +
	"uniform float m;" +
	"void main(void) {" +
	"	vec3 L = normalize(invMatrix * vec4(lightPosition - vVertex, 0.0)).xyz;" +
	"	vec3 V = normalize(invMatrix * vec4(eyePosition - vVertex, 0.0)).xyz;" +
	"	vec3 H = normalize(L + V);" +
	"	vec3 dx = dFdx(vVertex);" +
	"	vec3 dy = dFdy(vVertex);" +
	"	vec3 N  = normalize(cross(normalize(dx), normalize(dy)));" +
	"	float nh = max(dot(N, H), 1e-3);" +
	"	float nv = max(dot(N, V), 1e-3);" +
	"	float nl = max(dot(N, L), 1e-3);" +
	"	float hv = max(dot(H, V), 1e-3);" +
	"	float g = sqrt(ni*ni + hv*hv - 1.0);" +
	"	float gphv = g + hv;" +
	"	float gmhv = g - hv;" +
	"	float F = ((hv*gphv - 1.0)*(hv*gphv - 1.0) / ((hv*gmhv - 1.0)*(hv*gmhv - 1.0)) + 1.0) * gmhv*gmhv / (gphv*gphv);" +
	"	float D = exp((nh*nh - 1.0) / (m*m*nh*nh)) / (3.14*m*m*nh*nh*nh*nh);" +
	"	float G = min(min(2.0*nh*nv / hv, 2.0*nh*nl / hv), 1.0);" +
	"	float specular = max(G*D*F / (4.0*nl*nv), 0.0);" +
	"	float diffuse = max(nl - F, 0.0);" +
	"	gl_FragColor = vec4(diffuse*kd.rgb + specular*ks.rgb + ka.rgb, kd.a);" +
	"}";

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

class _attribute {
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
	 * VBO/IBOをバインド
	 * @param {_modelAttr} modelAttr
	 */
	bindBuffer(modelAttr) {
		this.#bindVbo(modelAttr.ver, this.#vertex, WebGLRenderingContext.FLOAT, 3);
		this.#gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, modelAttr.idx);
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

class _uniform {
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
	 * モデル拡散反射光
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
	 * モデル鏡面屈折率
	 * @type {WebGLUniformLocation}
	 */
	#ni;
	/**
	 * モデル表面の粗さ
	 * @type {WebGLUniformLocation}
	 */
	#m;

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
		this.#ni = gl.getUniformLocation(program, "ni");
		this.#m = gl.getUniformLocation(program, "m");
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
		this.#gl.uniformMatrix4fv(this.#mvpMatrix, false, this.#matMVP.array);
		this.#gl.uniformMatrix4fv(this.#mMatrix, false, matM.array);
		this.#gl.uniformMatrix4fv(this.#invMatrix, false, this.#matInvM.array);
		// uniformへ色情報を登録
		this.#gl.uniform4fv(this.#kd, group.kd.array);
		this.#gl.uniform4fv(this.#ka, group.ka.array);
		this.#gl.uniform4fv(this.#ks, group.ks.array);
		this.#gl.uniform1f(this.#ni, group.ni);
		this.#gl.uniform1f(this.#m, Math.exp(-Math.pow(Math.log10(Math.max(group.ns, 1.0))/2.0, 2.0)));
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
		this.#matV.setView(cam.eye, cam.up, cam.position);
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

class Cam {
	/**
	 * 視線
	 * @type {number[]}
	 */
	eye = [0, 0, 0];
	/**
	 * 上方向
	 * @type {number[]}
	 */
	up = [0, 1, 0];
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
	 * @type {_attribute}
	 */
	#attribute;
	/**
	 * uniform変数
	 * @type {_uniform}
	 */
	#uniform;

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

	#offset = new vec2();
	#cursor = new vec2();
	#scroll = 0;
	#lastCursor = new vec2();
	#lastTouch = new vec2();
	#lastDist = 0;
	#pressState = 0;
	#scale = 0.5;
	#azimuth = 0;
	#elevation = Math.PI/6;
	#posX = 0;
	#posY = 0;

	get Scale() { return this.#scale; }
	get Azimuth() { return this.#azimuth; }
	get Elevation() { return this.#elevation; }
	get Position() { return [this.#posX, this.#posY, 0]; }

	static get #LEFT() { return 1; }
	static get #RIGHT() { return 2; }
	static get #WHEEL() { return 4; }
	static get #SWIPE() { return 8; }
	static get #PINCH() { return 16; }

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
	 * @param {string} canvasId
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(canvasId, width, height) {
		this.#canvas = document.getElementById(canvasId);
		this.#canvas.width = width;
		this.#canvas.height = height;
		this.#offset = new vec3(width/2, height/2);

		this.#setEvents();

		this.#modelList = new Map();
		this.#bindingModel = null;
		this.#matP = new mat4();
		this.#matP.setPerspective(45, 1, 500, width / height);

		this.cam = new Cam();
		this.lightPosition = [0, 0, 0];

		this.#gl = this.#canvas.getContext("webgl");
		if(!this.#gl.getExtension('OES_standard_derivatives')){
			console.log('OES_standard_derivatives is not supported');
			return;
		}
		this.#gl.enable(WebGLRenderingContext.DEPTH_TEST);
		this.#gl.depthFunc(WebGLRenderingContext.LEQUAL);
		this.#gl.enable(WebGLRenderingContext.CULL_FACE);
		let vs = this.#createShader(_VS, WebGLRenderingContext.VERTEX_SHADER);
		let fs = this.#createShader(_FS, WebGLRenderingContext.FRAGMENT_SHADER);
		let pg = this.#createProgram(vs, fs);
		this.#attribute = new _attribute(this.#gl, pg);
		this.#uniform = new _uniform(this.#gl, pg);
	}

	#setEvents() {
		let self = this;
		this.#canvas.addEventListener("mousemove", function(ev) {
			self.#cursor.x = ev.offsetX - self.#offset.x;
			self.#cursor.y = self.#offset.y - ev.offsetY;
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

		this.#canvas.addEventListener("wheel", function(ev) {
			ev.preventDefault();
			self.#scroll = ev.deltaY*2e-3;
			self.#pressState |= Render.#WHEEL;
		});

		this.#canvas.addEventListener("touchmove", function(ev) {
			ev.preventDefault();
			let pos = self.#getTouchesAvgPos(ev);
			self.#cursor.x += pos.x - self.#lastTouch.x;
			self.#cursor.y += pos.y - self.#lastTouch.y;
			self.#lastTouch = pos;
			if (ev.touches.length > 1) {
				let dist = self.#getTouchesAvgDistance(ev, pos);
				self.#scroll += (dist - self.#lastDist) * 1e-2;
				self.#lastDist = dist;
				self.#pressState = Render.#PINCH;
			} else {
				self.#pressState = Render.#SWIPE;
			}
		});
		this.#canvas.addEventListener("touchstart", function(ev) {
			ev.preventDefault();
			let pos = self.#getTouchesAvgPos(ev);
			self.#lastTouch = pos;
			if (ev.touches.length > 1) {
				self.#lastDist = self.#getTouchesAvgDistance(ev, pos);
				self.#pressState = Render.#PINCH;
			} else {
				self.#pressState = Render.#SWIPE;
			}
		});
		this.#canvas.addEventListener("touchend", function(ev) {
			ev.preventDefault();
			self.#pressState = 0;
		});
	}

	/**
	 * @param {TouchEvent} ev
	 * @returns {vec2}
	 */
	#getTouchesAvgPos(ev) {
		let pos = new vec2();
		for (let i=0; i<ev.touches.length; i++) {
			pos.x += ev.touches[i].clientX - this.#offset.x;
			pos.y += this.#offset.y - ev.touches[i].clientY;
		}
		pos.x /= ev.touches.length;
		pos.y /= ev.touches.length;
		return pos;
	}

	/**
	 * @param {TouchEvent} ev
	 * @param {vec2} pos
	 * @returns {number}
	 */
	#getTouchesAvgDistance(ev, pos) {
		let dist = 0;
		for (let i=0; i<ev.touches.length; i++) {
			let dx = (ev.touches[i].clientX - this.#offset.x) - pos.x;
			let dy = (this.#offset.y - ev.touches[i].clientY) - pos.y;
			dist += Math.sqrt(dx*dx + dy*dy);
		}
		dist /= ev.touches.length;
		return dist;
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
				this.#attribute.removeBuffer(attr);
			}
			attr = this.#attribute.createBuffer(model);
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
				this.#attribute.removeBuffer(attr);
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
			this.#attribute.bindBuffer(this.#bindingModel);
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
			this.#uniform.drawModel(matM, grp);
		}
	}

	/**
	 * カメラ設定を適用
	 */
	applyCamera() {
		this.#uniform.applyCamera(this.#matP, this.cam);
	}

	/**
	 * 光源設定を適用
	 */
	applyLight() {
		this.#uniform.applyLight(this.lightPosition);
	}

	/**
	 * canvasを初期化
	 */
	clear() {
		this.#gl.clearColor(1.0, 1.0, 1.0, 1.0);
		this.#gl.clearDepth(1.0);
		this.#gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT);
		switch (this.#pressState) {
		case Render.#LEFT:
		case Render.#SWIPE: {
			let dx = this.#cursor.x - this.#lastCursor.x;
			let dy = this.#cursor.y - this.#lastCursor.y;
			this.#azimuth += 2 * Math.PI * dx / this.#canvas.width;
			this.#elevation -= Math.PI * dy / this.#canvas.height;
			if (this.#elevation < -Math.PI/2) {
				this.#elevation = -Math.PI/2;
			} else if (this.#elevation > Math.PI/2) {
				this.#elevation = Math.PI/2;
			}
			break;
		}
		case Render.#LEFT | Render.#RIGHT:
		case Render.#PINCH: {
			let dx = this.#cursor.x - this.#lastCursor.x;
			let dy = this.#cursor.y - this.#lastCursor.y;
			this.#posX += dx * 100 / this.#canvas.width;
			this.#posY += dy * 100 / this.#canvas.height;
			break;
		}
		default:
			break;
		}

		if ((this.#pressState & (Render.#WHEEL | Render.#PINCH)) > 0) {
			this.#pressState &= ~Render.#WHEEL;
			this.#scale *= Math.pow(2.0, this.#scroll);
			this.#scroll = 0;
		}

		this.#lastCursor.copyFrom(this.#cursor);
	}

	/**
	 * コンテキストの再描画
	 */
	flush() {
		this.#gl.flush();
	}
}
