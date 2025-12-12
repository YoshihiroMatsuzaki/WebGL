/**
 * 2次元ベクトル
 */
class vec2 {
	/** @type {number} */
	x;
	/** @type {number} */
	y;

	constructor(x=0, y=0) {
		this.x = x;
		this.y = y;
	}

	/**
	 * ユークリッドノルムを返します
	 * @returns {number}
	 */
	get norm() {
		return Math.hypot(this.x, this.y);
	}

	/**
	 * 設定元の値をコピーします
	 * @param {vec2} source 設定元
	 */
	copyFrom(source) {
		this.x = source.x;
		this.y = source.y;
	}

	/**
	 * 自身を正規化します
	 */
	normalize() {
		let k = Math.hypot(this.x, this.y);
		if (k > Number.EPSILON) {
			k = 1.0 / k;
		}
		this.x *= k;
		this.y *= k;
	}

	/**
	 * ベクトルの和(ベクトルa + ベクトルb)を設定します
	 * @param {vec2} a ベクトルa
	 * @param {vec2} b ベクトルb
	 */
	add(a, b) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
	}

	/**
	 * ベクトルの差(ベクトルa - ベクトルb)を設定します
	 * @param {vec2} a ベクトルa
	 * @param {vec2} b ベクトルb
	 */
	sub(a, b) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
	}

	/**
	 * 自身とベクトルvの要素ごとの積を設定します
	 * @param {vec2} v ベクトルv
	 */
	hadamard(v) {
		this.x *= v.x;
		this.y *= v.y;
	}

	/**
	 * 自身をスカラー倍します
	 * @param {number} k スケールk
	 */
	scale(k) {
		this.x *= k;
		this.y *= k;
	}

	/**
	 * 外積(自身 x ベクトルv)を返します
	 * @param {vec2} v ベクトルv
	 * @returns {number}
	 */
	cross(v) {
		return this.x*v.y - this.y*v.x;
	}

	/**
	 * 内積(自身・ベクトルv)を返します
	 * @param {vec2} v ベクトルv
	 * @returns {number}
	 */
	dot(v) {
		return this.x*v.x + this.y*v.y;
	}

	/**
	 * 自身と点Pとの距離を返します
	 * @param {vec2} p 点P
	 * @returns {number}
	 */
	distance(p) {
		let x = p.x - this.x;
		let y = p.y - this.y;
		return Math.hypot(x, y);
	}
}

/**
 * 3次元ベクトル
 */
class vec3 {
	/** @type {number} */
	x;
	/** @type {number} */
	y;
	/** @type {number} */
	z;

	constructor(x=0, y=0, z=0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	/**
	 * ユークリッドノルムを返します
	 * @returns {number}
	 */
	get norm() {
		return Math.hypot(this.x, this.y, this.z);
	}

	/**
	 * 設定元の値をコピーします
	 * @param {vec3} source 設定元
	 */
	copyFrom(source) {
		this.x = source.x;
		this.y = source.y;
		this.z = source.z;
	}

	/**
	 * 自身を正規化します
	 */
	normalize() {
		let k = Math.hypot(this.x, this.y, this.z);
		if (k > Number.EPSILON) {
			k = 1.0 / k;
		}
		this.x *= k;
		this.y *= k;
		this.z *= k;
	}

	/**
	 * ベクトルの和(ベクトルa + ベクトルb)を設定します
	 * @param {vec3} a ベクトルa
	 * @param {vec3} b ベクトルb
	 */
	add(a, b) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;
	}

	/**
	 * ベクトルの差(ベクトルa - ベクトルb)を設定します
	 * @param {vec3} a ベクトルa
	 * @param {vec3} b ベクトルb
	 */
	sub(a, b) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;
	}

	/**
	 * クロス積(ベクトルa x ベクトルb)を設定します
	 * @param {vec3} a ベクトルa
	 * @param {vec3} b ベクトルb
	 */
	cross(a, b) {
		let x = a.y*b.z - a.z*b.y;
		let y = a.z*b.x - a.x*b.z;
		this.z = a.x*b.y - a.y*b.x;
		this.x = x;
		this.y = y;
	}

	/**
	 * 自身とベクトルvの要素ごとの積を設定します
	 * @param {vec3} v ベクトルv
	 */
	hadamard(v) {
		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;
	}

	/**
	 * 自身をスカラー倍します
	 * @param {number} k スケールk
	 */
	scale(k) {
		this.x *= k;
		this.y *= k;
		this.z *= k;
	}

	/**
	 * 内積(自身・ベクトルv)を返します
	 * @param {vec3} v ベクトルv
	 * @returns {number}
	 */
	dot(v) {
		return this.x*v.x + this.y*v.y + this.z*v.z;
	}

	/**
	 * 自身と点Pとの距離を返します
	 * @param {vec3} p 点P
	 * @returns {number}
	 */
	distance(p) {
		let x = p.x - this.x;
		let y = p.y - this.y;
		let z = p.z - this.z;
		return Math.hypot(x, y, z);
	}
}

/**
 * クォータニオン
 */
class qtn {
	/**
	 * [w, x, y, z]成分を格納する配列
	 * @type {Float32Array}
	 */
	array = new Float32Array(4);

	/**
	 * クォータニオンを生成します
	 * @param {number} w w成分
	 * @param {number} x x成分
	 * @param {number} y y成分
	 * @param {number} z z成分
	 */
	constructor(w=1.0, x=0.0, y=0.0, z=0.0) {
		const d = this.array;
		d[0] = w;
		d[1] = x;
		d[2] = y;
		d[3] = z;
	}

	/**
	 * 設定元の値をコピーします
	 * @param {qtn} source 設定元
	 */
	copyFrom(source) {
		const s = source.array;
		const d = this.array;
		d[0] = s[0];
		d[1] = s[1];
		d[2] = s[2];
		d[3] = s[3];
	}

	/**
	 * 自身を正規化します
	 */
	normalize() {
		const d = this.array;
		const n = Math.sqrt(d[0]*d[0] + d[1]*d[1] + d[2]*d[2] + d[3]*d[3]);
		d[0] /= n;
		d[1] /= n;
		d[2] /= n;
		d[3] /= n;
	}

	/**
	 * 単位元として設定します
	 */
	setIdentity() {
		const d = this.array;
		d[0] = 1.0;
		d[1] = 0.0;
		d[2] = 0.0;
		d[3] = 0.0;
	}

	/**
	 * クォータニオンaとクォータニオンbの積を設定します
	 * @param {qtn} a クォータニオンa
	 * @param {qtn} b クォータニオンb
	 */
	setMul(a, b) {
		const aw = a.array[0], ax = a.array[1], ay = a.array[2], az = a.array[3];
		const bw = b.array[0], bx = b.array[1], by = b.array[2], bz = b.array[3];
		const d = this.array;
		d[0] = aw*bw -ax*bx -ay*by -az*bz;
		d[1] = ax*bw +aw*bx -az*by +ay*bz;
		d[2] = ay*bw +az*bx +aw*by -ax*bz;
		d[3] = az*bw -ay*bx +ax*by +aw*bz;
	}

	/**
	 * 角速度ベクトルωを用いて、クォータニオンqの時間微分を設定します
	 * @param {qtn} q クォータニオンq
	 * @param {number[]} omega 角速度ベクトルω
	 */
	setGyro(q, omega) {
		const wx = omega[0], wy = omega[1], wz = omega[2];
		const qw = q.array[0], qx = q.array[1], qy = q.array[2], qz = q.array[3];
		const d = this.array;
		d[0] = (       wx*qx +wy*qy +wz*qz)*0.5;
		d[1] = (wx*qw        +wz*qy -wy*qz)*0.5;
		d[2] = (wy*qw -wz*qx        +wx*qz)*0.5;
		d[3] = (wz*qw +wy*qx -wx*qy       )*0.5;
	}

	/**
	 * 回転を表現するクォータニオンとして設定します
	 * @param {number[]} axis 回転軸
	 * @param {number} angle 回転量(弧度法)
	 */
	setRot(axis, angle) {
		let ax = axis[0], ay = axis[1], az = axis[2];
		const an = Math.sqrt(ax*ax + ay*ay + az*az);
		ax /= an;
		ay /= an;
		az /= an;
		const s = Math.sin(angle * 0.5);
		const d = this.array;
		d[0] = Math.cos(angle * 0.5);
		d[1] = ax*s;
		d[2] = ay*s;
		d[3] = az*s;
	}

	/**
	 * クォータニオンaとクォータニオンbの間を大円補間した結果を設定します
	 * @param {qtn} a クォータニオンa
	 * @param {qtn} b クォータニオンb
	 * @param {number} time 0～1の値 (0:a, 1:b)
	 */
	setSlerp(a, b, time) {
		const aw = a.array[0], ax = a.array[1], ay = a.array[2], az = a.array[3];
		const bw = b.array[0], bx = b.array[1], by = b.array[2], bz = b.array[3];
		const dot = aw*bw + ax*bx + ay*by + az*bz;
		const idot = 1.0 - dot*dot;
		const d = this.array;
		if (idot < 1e-4) {
			d[0] = aw;
			d[1] = ax;
			d[2] = ay;
			d[3] = az;
		} else {
			let th0, th1;
			if (dot < 0.0) {
				th0 = Math.acos(-dot);
				th1 = -th0 * time;
				th0 += th1;
			} else {
				th0 = Math.acos(dot);
				th1 = th0 * time;
				th0 -= th1;
			}
			const r = 1.0 / Math.sqrt(idot);
			const t0 = r * Math.sin(th0);
			const t1 = r * Math.sin(th1);
			d[0] = aw*t0 + bw*t1;
			d[1] = ax*t0 + bx*t1;
			d[2] = ay*t0 + by*t1;
			d[3] = az*t0 + bz*t1;
		}
	}

	/**
	 * 行列に変換した結果を返します
	 * @param {mat4} returnValue 戻り値
	 */
	toMat4(returnValue) {
		const a = this.array;
		const w = a[0], x = a[1], y = a[2], z = a[3];
		const x2 = x+x, y2 = y+y, z2 = z+z;

		const wx = w*x2;
		const wy = w*y2;
		const wz = w*z2;

		const xx = x*x2;
		const xy = x*y2;
		const xz = x*z2;

		const yy = y*y2;
		const yz = y*z2;

		const zz = z*z2;

		const d = returnValue.array;
		d[0] = 1.0 - (yy + zz);
		d[1] = xy - wz;
		d[2] = xz + wy;
		d[3] = 0.0;

		d[4] = xy + wz;
		d[5] = 1.0 - (xx + zz);
		d[6] = yz - wx;
		d[7] = 0.0;

		d[8]  = xz - wy;
		d[9]  = yz + wx;
		d[10] = 1.0 - (xx + yy);
		d[11] = 0.0;

		d[12] = 0.0;
		d[13] = 0.0;
		d[14] = 0.0;
		d[15] = 1.0;
	}

	/**
	 * このクォータニオンをベクトルvに適用し、回転後のベクトルを返します
	 * @param {vec3} returnValue 戻り値
	 * @param {vec3} v ベクトルv
	 */
	apply(returnValue, v) {
		const a = this.array;
		const qw = a[0], qx = a[1], qy = a[2], qz = a[3];
		const vx = v.x, vy = v.y, vz = v.z;
		let tx = qy*vz;
		tx -= qz*vy;
		tx += tx;
		let ty = qz*vx;
		ty -= qx*vz;
		ty += ty;
		let tz = qx*vy;
		tz -= qy*vx;
		tz += tz;
		let cx = qy*tz;
		cx -= qz*ty;
		cx -= qw*tx;
		cx += vx;
		let cy = qz*tx;
		cy -= qx*tz;
		cy -= qw*ty;
		cy += vy;
		let cz = qx*ty;
		cz -= qy*tx;
		cz -= qw*tz;
		cz += vz;
		returnValue.x = cx;
		returnValue.y = cy;
		returnValue.z = cz;
	}
}

/**
 * 4x4行列
 */
class mat4 {
	/**
	 * 4x4行列の要素を格納する配列
	 * @type {Float32Array}
	 */
	array = new Float32Array(16);

	/**
	 * 設定元の値をコピーします
	 * @param {mat4} source 設定元
	 */
	copyFrom(source) {
		const s = source.array;
		const d = this.array;
		d[0] = s[0];
		d[1] = s[1];
		d[2] = s[2];
		d[3] = s[3];

		d[4] = s[4];
		d[5] = s[5];
		d[6] = s[6];
		d[7] = s[7];

		d[8]  = s[8];
		d[9]  = s[9];
		d[10] = s[10];
		d[11] = s[11];

		d[12] = s[12];
		d[13] = s[13];
		d[14] = s[14];
		d[15] = s[15];
	}

	/**
	 * 値を設定します
	 * @param  {...number} values 値
	 */
	set(...values) {
		const d = this.array;
		d[0] = values[0];
		d[1] = values[1];
		d[2] = values[2];
		d[3] = values[3];

		d[4] = values[4];
		d[5] = values[5];
		d[6] = values[6];
		d[7] = values[7];

		d[8]  = values[8];
		d[9]  = values[9];
		d[10] = values[10];
		d[11] = values[11];

		d[12] = values[12];
		d[13] = values[13];
		d[14] = values[14];
		d[15] = values[15];
	}

	/**
	 * 単位行列として設定します
	 */
	setIdentity() {
		const d = this.array;
		d[0] = 1.0;
		d[1] = 0.0;
		d[2] = 0.0;
		d[3] = 0.0;

		d[4] = 0.0;
		d[5] = 1.0;
		d[6] = 0.0;
		d[7] = 0.0;

		d[8]  = 0.0;
		d[9]  = 0.0;
		d[10] = 1.0;
		d[11] = 0.0;

		d[12] = 0.0;
		d[13] = 0.0;
		d[14] = 0.0;
		d[15] = 1.0;
	}

	/**
	 * 行列Aと行列Bの積を設定します
	 * @param {mat4} ma 行列A
	 * @param {mat4} mb 行列B
	 */
	setMul(ma, mb) {
		const a = ma.array;
		const a11 = a[0],  a12 = a[1],  a13 = a[2],  a14 = a[3],
			  a21 = a[4],  a22 = a[5],  a23 = a[6],  a24 = a[7],
			  a31 = a[8],  a32 = a[9],  a33 = a[10], a34 = a[11],
			  a41 = a[12], a42 = a[13], a43 = a[14], a44 = a[15]
		;
		const b = mb.array;
		const b11 = b[0],  b12 = b[1],  b13 = b[2],  b14 = b[3],
			  b21 = b[4],  b22 = b[5],  b23 = b[6],  b24 = b[7],
			  b31 = b[8],  b32 = b[9],  b33 = b[10], b34 = b[11],
			  b41 = b[12], b42 = b[13], b43 = b[14], b44 = b[15]
		;
		const d = this.array;
		d[0]  = a11*b11 +a21*b12 +a31*b13 +a41*b14;
		d[1]  = a12*b11 +a22*b12 +a32*b13 +a42*b14;
		d[2]  = a13*b11 +a23*b12 +a33*b13 +a43*b14;
		d[3]  = a14*b11 +a24*b12 +a34*b13 +a44*b14;

		d[4]  = a11*b21 +a21*b22 +a31*b23 +a41*b24;
		d[5]  = a12*b21 +a22*b22 +a32*b23 +a42*b24;
		d[6]  = a13*b21 +a23*b22 +a33*b23 +a43*b24;
		d[7]  = a14*b21 +a24*b22 +a34*b23 +a44*b24;

		d[8]  = a11*b31 +a21*b32 +a31*b33 +a41*b34;
		d[9]  = a12*b31 +a22*b32 +a32*b33 +a42*b34;
		d[10] = a13*b31 +a23*b32 +a33*b33 +a43*b34;
		d[11] = a14*b31 +a24*b32 +a34*b33 +a44*b34;

		d[12] = a11*b41 +a21*b42 +a31*b43 +a41*b44;
		d[13] = a12*b41 +a22*b42 +a32*b43 +a42*b44;
		d[14] = a13*b41 +a23*b42 +a33*b43 +a43*b44;
		d[15] = a14*b41 +a24*b42 +a34*b43 +a44*b44;
	}

	/**
	 * 行列Aの逆行列を設定します
	 * @param {mat4} ma 行列A
	 */
	setInverse(ma) {
		const a = ma.array;
		const a11 = a[0],  a12 = a[1],  a13 = a[2],  a14 = a[3],
			  a21 = a[4],  a22 = a[5],  a23 = a[6],  a24 = a[7],
			  a31 = a[8],  a32 = a[9],  a33 = a[10], a34 = a[11],
			  a41 = a[12], a42 = a[13], a43 = a[14], a44 = a[15]
		;

		const c11 = a11*a22 - a12*a21;
		const c12 = a11*a23 - a13*a21;
		const c13 = a11*a24 - a14*a21;
		const c22 = a12*a23 - a13*a22;
		const c23 = a12*a24 - a14*a22;
		const c33 = a13*a24 - a14*a23;

		const d11 = a31*a42 - a32*a41;
		const d12 = a31*a43 - a33*a41;
		const d13 = a31*a44 - a34*a41;
		const d22 = a32*a43 - a33*a42;
		const d23 = a32*a44 - a34*a42;
		const d33 = a33*a44 - a34*a43;

		const k = 1.0 / (
			 c11*d33
			-c12*d23
			+c13*d22
			+c22*d13
			-c23*d12
			+c33*d11
		);
		const d = this.array;
		d[0]  = ( a22*d33 -a23*d23 +a24*d22)*k;
		d[1]  = (-a12*d33 +a13*d23 -a14*d22)*k;
		d[2]  = ( a42*c33 -a43*c23 +a44*c22)*k;
		d[3]  = (-a32*c33 +a33*c23 -a34*c22)*k;

		d[4]  = (-a21*d33 +a23*d13 -a24*d12)*k;
		d[5]  = ( a11*d33 -a13*d13 +a14*d12)*k;
		d[6]  = (-a41*c33 +a43*c13 -a44*c12)*k;
		d[7]  = ( a31*c33 -a33*c13 +a34*c12)*k;

		d[8]  = ( a21*d23 -a22*d13 +a24*d11)*k;
		d[9]  = (-a11*d23 +a12*d13 -a14*d11)*k;
		d[10] = ( a41*c23 -a42*c13 +a44*c11)*k;
		d[11] = (-a31*c23 +a32*c13 -a34*c11)*k;

		d[12] = (-a21*d22 +a22*d12 -a23*d11)*k;
		d[13] = ( a11*d22 -a12*d12 +a13*d11)*k;
		d[14] = (-a41*c22 +a42*c12 -a43*c11)*k;
		d[15] = ( a31*c22 -a32*c12 +a33*c11)*k;
	}

	/**
	 * ビュー座標変換行列として設定します
	 * @param {number[]} eye 視線ベクトル
	 * @param {number[]} up 上方向ベクトル
	 * @param {number[]} position カメラ位置
	 */
	setView(eye, up, position) {
		let ex = eye[0], ey = eye[1], ez = eye[2];
		const en = Math.sqrt(ex*ex + ey*ey + ez*ez);
		const ux = up[0], uy = up[1], uz = up[2];

		let zx = ex/en;
		let zy = ey/en;
		let zz = ez/en;

		let xx = uy*zz - uz*zy;
		let xy = uz*zx - ux*zz;
		let xz = ux*zy - uy*zx;
		let xn = Math.sqrt(xx*xx + xy*xy + xz*xz);

		if (xn < 1e-3) {
			const th = Math.atan2(ez, ex);
			const ph = Math.atan2(ey, Math.sqrt(ex*ex + ez*ez)) - 1e-6;
			ex = en*Math.cos(ph)*Math.cos(th);
			ey = en*Math.sin(ph);
			ez = en*Math.cos(ph)*Math.sin(th);

			zx = ex/en;
			zy = ey/en;
			zz = ez/en;

			xx = uy*zz - uz*zy;
			xy = uz*zx - ux*zz;
			xz = ux*zy - uy*zx;
			xn = Math.sqrt(xx*xx + xy*xy + xz*xz);
		}

		xx /= xn;
		xy /= xn;
		xz /= xn;

		const yx = zy*xz - zz*xy;
		const yy = zz*xx - zx*xz;
		const yz = zx*xy - zy*xx;

		const d = this.array;
		d[0] = xx;
		d[1] = yx;
		d[2] = zx;
		d[3] = 0.0;

		d[4] = xy;
		d[5] = yy;
		d[6] = zy;
		d[7] = 0.0;

		d[8]  = xz;
		d[9]  = yz;
		d[10] = zz;
		d[11] = 0.0;

		d[12] = position[0] - (xx*ex + xy*ey + xz*ez);
		d[13] = position[1] - (yx*ex + yy*ey + yz*ez);
		d[14] = position[2] - (zx*ex + zy*ey + zz*ez);
		d[15] = 1.0;
	}

	/**
	 * 射影座標変換行列として設定します
	 * @param {number} fovy 垂直方向の視野角(度数法)
	 * @param {number} near 近クリップ面までの距離
	 * @param {number} far 遠クリップ面までの距離
	 * @param {number} aspect アスペクト比（幅/高さ）
	 */
	setPerspective(fovy, near, far, aspect) {
		const t = near * Math.tan(fovy * Math.PI / 360.0);
		const l = far - near;
		const d = this.array;
		d[0] = near / (t * aspect);
		d[1] = 0.0;
		d[2] = 0.0;
		d[3] = 0.0;

		d[4] = 0.0;
		d[5] = near / t;
		d[6] = 0.0;
		d[7] = 0.0;

		d[8]  = 0.0;
		d[9]  = 0.0;
		d[10] = -(far + near) / l;
		d[11] = -1.0;

		d[12] = 0.0;
		d[13] = 0.0;
		d[14] = -(far * near * 2.0) / l;
		d[15] = 0.0;
	}

	/**
	 * 自身をベクトルvに左から掛け合わせた結果を返します
	 * @param {vec3} returnValue 戻り値
	 * @param {vec3} v ベクトルv
	 */
	apply(returnValue, v) {
		const a = this.array;
		const vx = v.x, vy = v.y, vz = v.z;

		let x = a[0]*vx;
		let y = a[1]*vx;
		let z = a[2]*vx;
		let w = a[3]*vx;

		x += a[4]*vy;
		y += a[5]*vy;
		z += a[6]*vy;
		w += a[7]*vy;

		x += a[8] *vz;
		y += a[9] *vz;
		z += a[10]*vz;
		w += a[11]*vz;

		x += a[12];
		y += a[13];
		z += a[14];
		w += a[15];

		if (Math.abs(w) > Number.EPSILON) {
			w = 1.0 / w;
		}
		returnValue.x = x * w;
		returnValue.y = y * w;
		returnValue.z = z * w;
	}
}
