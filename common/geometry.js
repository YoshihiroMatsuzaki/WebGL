/// <reference path="math.js" />
/// <reference path="model.js" />

const INT_MAX = 1e10;
const INT_MIN = -1e10;

class _face {
	/** @type {number} */
	a;
	/** @type {number} */
	o;
	/** @type {number} */
	b;
	constructor(a, o, b) {
		this.a = a;
		this.o = o;
		this.b = b;
	}
}

class _nestInfo {
	/** 親へのインデックス */
	parent = -1;
	/** ネストの深さ */
	depth = 0;
}

class _vInfo {
	deleted = false;
	/** @type {number} */
	distance;
}

class _transform {
	/** @type {number} */
	time;
	/** @type {qtn} */
	rot = null;
	/** @type {vec3} */
	scale = null;
	/** @type {vec3} */
	translate = null;
}

class Geometry2d {
	/** @type {vec2[][]} */
	#lines = [];

	/**
	 * 矩形
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 * @param {number} angle
	 */
	addRectangle(x, y, w, h, angle) {
		let line = [];
		w *= 0.5;
		h *= 0.5;
		line.push(new vec2(-w, -h));
		line.push(new vec2(w, -h));
		line.push(new vec2(w, h));
		line.push(new vec2(-w, h));
		Geometry2d.#rotTrans(line, angle, x, y);
		this.#lines.push(line);
	}

	/**
	 * 円
	 * @param {number} x
	 * @param {number} y
	 * @param {number} d
	 * @param {number} div
	 */
	addCircle(x, y, d, div) {
		let line = [];
		let r = d / 2;
		for (let i=0; i<div; i++) {
			let th = 2*Math.PI*i/div;
			line.push(new vec2(
				r * Math.cos(th) + x,
				r * Math.sin(th) + y
			));
		}
		this.#lines.push(line);
	}

	/**
	 * カプセル形
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} length
	 * @param {number} angle
	 * @param {number} div
	 */
	addCapsule(x, y, w, length, angle, div) {
		const OFS_TH = Math.PI/2;
		let line = [];
		let r = w / 2;
		let ofsX = (length < w) ? 0 : (length - w) / 2;
		for (let i=0; i<div; i++) {
			let th = Math.PI*i/div - OFS_TH;
			line.push(new vec2(
				r * Math.cos(th) + ofsX,
				r * Math.sin(th)
			));
		}
		for (let i=0; i<div; i++) {
			let th = Math.PI*i/div + OFS_TH;
			line.push(new vec2(
				r * Math.cos(th) - ofsX,
				r * Math.sin(th)
			));
		}
		Geometry2d.#rotTrans(line, angle, x, y);
		this.#lines.push(line);
	}

	/**
	 * オブジェクトを作成
	 * @param {number} bottom
	 * @param {number} height
	 * @param {string} name
	 * @param {Color} color
	 */
	createObject(bottom, height, name="", color=Color.GREEN) {
		/** @type {number[][]} */
		let indexesBottom = [];
		/** @type {number[][]} */
		let indexesTop = [];
		/** @type {vec2[]} */
		let tempVerts = [];
		let indexOfs = 0;

		let group = new Group(name, 0);
		group.usemtl = name;
		group.kd.setFrom(color);
		group.ka.setFrom(color.light(0.3));
		group.ks.setFrom(Color.WHITE);
		group.ns = 20;
		let retModel = new Model();
		retModel.grp.push(group);

		for (let i = 0; i < this.#lines.length; i++) {
			let line = this.#lines[i];
			let pointCount = line.length;
			if (0 == pointCount) {
				continue;
			}

			// 底面頂点を出力
			let indexBottom = [];
			for (let j = 0; j < pointCount; j++) {
				let p = line[j];
				tempVerts.push(p);
				indexBottom.push(indexOfs + j);
				retModel.ver.push(p.x, bottom, p.y);
			}
			indexesBottom.push(indexBottom);
			indexOfs += pointCount;

			// 上面頂点を出力
			let indexTop = [];
			for (let j = 0; j < pointCount; j++) {
				let p = line[j];
				tempVerts.push(p);
				indexTop.push(indexOfs + pointCount - j - 1);
				retModel.ver.push(p.x, bottom + height, p.y);
			}
			indexesTop.push(indexTop);
			indexOfs += pointCount;
		}

		// 穴部分に該当する線をマージ
		const BOTTOM_ORDER = -1;
		const TOP_ORDER = 1;
		Geometry2d.#margeLines(tempVerts, indexesBottom, BOTTOM_ORDER);
		Geometry2d.#margeLines(tempVerts, indexesTop, TOP_ORDER);

		// 底面を出力
		for (let i = 0; i < indexesBottom.length; i++) {
			let index = indexesBottom[i];
			if (0 == index.length) {
				continue;
			}
			/** @type {_face[]} */
			let s = [];
			Geometry2d.#createPolygon(tempVerts, index, s, BOTTOM_ORDER);
			for (let j = 0; j < s.length; j++) {
				var f = s[j];
				retModel.idx.push(f.a, f.o, f.b);
				group.indexCount += 3;
			}
		}

		// 上面を出力
		for (let i = 0; i < indexesTop.length; i++) {
			let index = indexesTop[i];
			if (0 == index.length) {
				continue;
			}
			/** @type {_face[]} */
			let s = [];
			Geometry2d.#createPolygon(tempVerts, index, s, TOP_ORDER);
			for (let j = 0; j < s.length; j++) {
				var f = s[j];
				retModel.idx.push(f.a, f.o, f.b);
				group.indexCount += 3;
			}
		}

		// 側面を出力
		for (let i = 0; i < indexesBottom.length; i++) {
			let indexBottom = indexesBottom[i];
			let indexTop = indexesTop[i];
			if (indexBottom.length != indexTop.length) {
				continue;
			}
			let pointCount = indexBottom.length;
			for (let ib = 0; ib < pointCount; ib++) {
				let ix1 = indexBottom[ib];
				let v1 = tempVerts[ix1];
				let ix2;
				for (let it = 0; it < pointCount; it++) {
					let i2 = indexTop[it];
					let v2 = tempVerts[i2];
					if (v1.distance(v2) < 1e-12) {
						ix2 = i2;
						break;
					}
				}
				let ix0 = indexBottom[(ib + 1) % pointCount];
				let v0 = tempVerts[ix0];
				let ix3;
				for (let it = 0; it < pointCount; it++) {
					let i3 = indexTop[it];
					let v3 = tempVerts[i3];
					if (v0.distance(v3) < 1e-12) {
						ix3 = i3;
						break;
					}
				}
				retModel.idx.push(ix0, ix1, ix2);
				retModel.idx.push(ix0, ix2, ix3);
				group.indexCount += 6;
			}
		}
		return retModel;
	}

	/**
	 * @param {vec2[]} vertex
	 * @param {number[]} index
	 * @param {_face[]} faceList
	 * @param {number} order
	 * @returns {number}
	 */
	static #createPolygon(vertex, index, faceList, order) {
		const INDEX_COUNT = index.length;
		const INDEX_NEXT = INDEX_COUNT + order;
		const INDEX_RIGHT = 1;
		const INDEX_LEFT = INDEX_COUNT - 1;
		const ORIGIN = new vec2(INT_MIN, INT_MIN);

		/** @type {_vInfo[]} */
		let vInfoList = [];
		for (let i = 0; i < INDEX_COUNT; i++) {
			let vInfo = new _vInfo();
			vInfo.distance = ORIGIN.distance(vertex[index[i]]);
			vInfoList.push(vInfo);
		}

		/**
		 ** 頂点(va)
		 * @type {vec2}
		 */
		let va;
		/**
		 ** 頂点(vo)
		 * @type {vec2}
		 */
		let vo;
		/**
		 ** 頂点(vb)
		 * @type {vec2}
		 */
		let vb;

		/*** 頂点数 */
		let vertexCount = 0;
		/*** 逆面数 */
		let reverseCount = 0;
		/*** 面積 */
		let s = 0.0;

		do { // 最も遠くにある頂点(vo)の取得ループ
			vertexCount = 0;
			reverseCount = 0;

			/*** 最も遠くにある頂点(vo)を取得 */
			let ixO = 0;
			let distanceMax = 0.0;
			for (let i = 0; i < INDEX_COUNT; i++) {
				let vInfo = vInfoList[i];
				if (vInfo.deleted) {
					continue;
				}
				if (distanceMax < vInfo.distance) {
					distanceMax = vInfo.distance;
					ixO = i;
				}
				vertexCount++;
			}
			vo = vertex[index[ixO]];

			while (true) { // 頂点(vo)の移動ループ
				/*** 頂点(vo)を基準に頂点(va)を取得 */
				let ixA = (ixO + INDEX_LEFT) % INDEX_COUNT;
				for (let i = 0; i < INDEX_COUNT; i++) {
					if (vInfoList[ixA].deleted) {
						ixA = (ixA + INDEX_LEFT) % INDEX_COUNT;
					} else {
						break;
					}
				}
				va = vertex[index[ixA]];

				/*** 頂点(vo)を基準に頂点(vb)を取得 */
				let ixB = (ixO + INDEX_RIGHT) % INDEX_COUNT;
				for (let i = 0; i < INDEX_COUNT; i++) {
					if (vInfoList[ixB].deleted) {
						ixB = (ixB + INDEX_RIGHT) % INDEX_COUNT;
					} else {
						break;
					}
				}
				vb = vertex[index[ixB]];

				/*** 三角形(va,vo,vb)の表裏を確認 */
				let aobNormal = va.sub(vo).cross(vb.sub(vo)) * order;
				if (aobNormal < 0) {
					// [裏の場合]
					reverseCount++;
					if (INDEX_COUNT < reverseCount) {
						// [表になる三角形(va,vo,vb)がない場合]
						// 頂点(vo)を検索対象から削除
						vInfoList[ixO].deleted = true;
						// 次の最も遠くにある頂点(vo)を取得
						break;
					}
					// 頂点(vo)を隣に移動
					ixO = (ixO + INDEX_NEXT) % INDEX_COUNT;
					for (let i = 0; i < INDEX_COUNT; i++) {
						if (vInfoList[ixO].deleted) {
							ixO = (ixO + INDEX_NEXT) % INDEX_COUNT;
						} else {
							break;
						}
					}
					vo = vertex[index[ixO]];
					continue;
				}

				/*** 三角形(va,vo,vb)の内側に他の頂点がないか確認 */
				let pointInTriangle = false;
				for (let i = 0; i < INDEX_COUNT; i++) {
					if (i == ixA || i == ixO || i == ixB || vInfoList[i].deleted) {
						continue;
					}
					let p = vertex[index[i]];
					if (Geometry2d.#hasInnerPoint(va, vo, vb, p)) {
						pointInTriangle = true;
						break;
					}
				}
				if (pointInTriangle) {
					// [三角形(va,vo,vb)の内側に他の頂点がある場合]
					// 頂点(vo)を隣に移動
					ixO = (ixO + INDEX_NEXT) % INDEX_COUNT;
					for (let i = 0; i < INDEX_COUNT; i++) {
						if (vInfoList[ixO].deleted) {
							ixO = (ixO + INDEX_NEXT) % INDEX_COUNT;
						} else {
							break;
						}
					}
					vo = vertex[index[ixO]];
				} else {
					// [三角形(va,vo,vb)の内側に他の頂点がない場合]
					// 三角形(va,vo,vb)を面リストに追加
					let f = new _face(index[ixA], index[ixO], index[ixB]);
					faceList.push(f);
					// 三角形の面積を加算
					s += Math.abs(aobNormal) / 2.0;
					// 頂点(vo)を検索対象から削除
					vInfoList[ixO].deleted = true;
					// 次の最も遠くにある頂点(vo)を取得
					break;
				}
			} // 頂点(vo)の移動ループ
		} while (3 < vertexCount); // 最も遠くにある頂点(vo)の取得ループ
		return s;
	}

	/**
	 * @param {vec2} a
	 * @param {vec2} o
	 * @param {vec2} b
	 * @param {vec2} p
	 * @returns {boolean}
	 */
	static #hasInnerPoint(a, o, b, p) {
		let oapNormal = o.sub(a).cross(p.sub(a));
		let bopNormal = b.sub(o).cross(p.sub(o));
		let abpNormal = a.sub(b).cross(p.sub(b));
		if (oapNormal > 0 && bopNormal > 0 && abpNormal > 0) {
			return true;
		}
		if (oapNormal < 0 && bopNormal < 0 && abpNormal < 0) {
			return true;
		}
		if (oapNormal == 0 && (bopNormal > 0 && abpNormal > 0 || abpNormal < 0 && bopNormal < 0)) {
			return true;
		}
		if (bopNormal == 0 && (abpNormal > 0 && oapNormal > 0 || oapNormal < 0 && abpNormal < 0)) {
			return true;
		}
		if (abpNormal == 0 && (oapNormal > 0 && bopNormal > 0 || bopNormal < 0 && oapNormal < 0)) {
			return true;
		}
		return false;
	}

	/**
	 * @param {_face[]} outerSurfList
	 * @param {_face[]} innerSurfList
	 * @param {vec2[]} vertex
	 * @returns {boolean}
	 */
	static #hasInnerPolygon(outerSurfList, innerSurfList, vertex) {
		for (let i = 0; i < outerSurfList.length; i++) {
			let outer = outerSurfList[i];
			let outerA = vertex[outer.a];
			let outerO = vertex[outer.o];
			let outerB = vertex[outer.b];
			let innerCount = innerSurfList.length;
			for (let j = 0; j < innerCount; j++) {
				let inner = innerSurfList[j];
				let innerA = vertex[inner.a];
				let innerO = vertex[inner.o];
				let innerB = vertex[inner.b];
				if (Geometry2d.#hasInnerPoint(outerA, outerO, outerB, innerA)) {
					return true;
				}
				if (Geometry2d.#hasInnerPoint(outerA, outerO, outerB, innerO)) {
					return true;
				}
				if (Geometry2d.#hasInnerPoint(outerA, outerO, outerB, innerB)) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * @param {vec2[]} vertex
	 * @param {number[][]} indexes
	 * @param {number} order
	 */
	static #margeLines(vertex, indexes, order) {
		/** @type {_nestInfo[]} */
		let nestInfo = [];
		for (let i = 0; i < indexes.length; i++) {
			nestInfo.push(new _nestInfo());
		}

		// 入れ子になっている線を検索
		for (let ixOuter = 0; ixOuter < indexes.length; ixOuter++) {
			if (indexes[ixOuter].length < 3) {
				indexes[ixOuter] = [];
				continue;
			}
			let innerCount = indexes.length;
			for (let ixInner = 0; ixInner < innerCount; ixInner++) {
				if (indexes[ixInner].length < 3) {
					indexes[ixInner] = [];
					continue;
				}
				if (ixInner == ixOuter) {
					continue;
				}
				let inner = nestInfo[ixInner];
				if (nestInfo[ixOuter].depth < inner.depth) {
					continue;
				}
				/** @type {_face[]} */
				let outerSurf = [];
				/** @type {_face[]} */
				let innerSurf = [];
				let outerS = Geometry2d.#createPolygon(vertex, indexes[ixOuter], outerSurf, order);
				let innerS = Geometry2d.#createPolygon(vertex, indexes[ixInner], innerSurf, order);
				if (innerS < outerS && Geometry2d.#hasInnerPolygon(outerSurf, innerSurf, vertex)) {
					inner.parent = ixOuter;
					inner.depth++;
				}
			}
		}

		// 穴に該当する線を親の線にマージ
		while (true) {
			let mostNear = INT_MAX*INT_MAX;
			let ixInner = 0;
			/** @type {_nestInfo} */
			let inner = null;
			let nestCount = nestInfo.length;
			for (let i = 0; i < nestCount; i++) {
				let innerTemp = nestInfo[i];
				if (0 == innerTemp.depth % 2) {
					// depth=偶数: 穴に該当しない線
					continue;
				}
				if (i == innerTemp.parent) {
					continue;
				}
				if (indexes[i].length < 3) {
					continue;
				}
				let p = vertex[indexes[i][0]];
				let ox, oy;
				if (order < 0) {
					ox = p.x - INT_MAX;
					oy = p.y - INT_MAX;
				} else {
					ox = p.x - INT_MIN;
					oy = p.y - INT_MIN;
				}
				let dist = Math.sqrt(ox * ox + oy * oy);
				if (dist < mostNear) {
					// 原点から近い線を優先してマージする
					ixInner = i;
					inner = innerTemp;
					mostNear = dist;
				}
			}
			if (null == inner) {
				break;
			}

			// 穴に該当する線と親の線で互いに最も近い頂点を検索
			// 互いに最も近い点をマージ開始位置に設定する
			let insertSrc = 0, insertDst = 0;
			mostNear = INT_MAX*INT_MAX;
			let indexC = indexes[ixInner];
			let indexP = indexes[inner.parent];
			let parentCount = indexP.length;
			for (let iChild = 0; iChild < indexC.length; iChild++) {
				let vc = vertex[indexC[iChild]];
				for (let iParent = 0; iParent < parentCount; iParent++) {
					let vp = vertex[indexP[iParent]];
					let dist = vc.distance(vp);
					if (dist < mostNear) {
						insertSrc = iChild;
						insertDst = iParent;
						mostNear = dist;
					}
				}
			}

			// マージ
			let temp = [];
			for (let i = 0; i <= insertDst && i < indexP.length; i++) {
				temp.push(indexP[i]);
			}
			let innerSize = indexC.length;
			for (let i = 0; i < innerSize; i++) {
				let ix = (innerSize + insertSrc - i) % innerSize;
				temp.push(indexC[ix]);
			}
			temp.push(indexC[insertSrc]);
			for (let i = insertDst; i < indexP.length; i++) {
				temp.push(indexP[i]);
			}
			indexes[inner.parent] = temp;
			indexes[ixInner] = [];
		}
	}

	/**
	 * @param {vec2[]} line
	 * @param {number} angle
	 * @param {number} tx
	 * @param {number} ty
	 */
	static #rotTrans(line, angle, tx, ty) {
		var rad = angle*Math.PI/180;
		var rotX = Math.cos(rad);
		var rotY = Math.sin(rad);
		for (let i=0; i<line.length; i++) {
			var v = line[i];
			var rx = v.x * rotX - v.y * rotY;
			var ry = v.x * rotY + v.y * rotX;
			v.x = rx + tx;
			v.y = ry + ty;
		}
	}
}

class Cylinder {
	/** @type {_transform[]} */
	#scaleList;
	/** @type {_transform[]} */
	#rotList;
	/** @type {_transform[]} */
	#transList;

	/** @type {vec3[][]} */
	#ver;
	/** @type {number[]} */
	#idx;

	/**
	 * @param {number} lenDiv 長手方向分割数
	 * @param {number} rotDiv 回転分割数
	 */
	constructor(lenDiv, rotDiv) {
		this.#scaleList = [];
		this.#rotList = [];
		this.#transList = [];
		this.#ver = [];
		for (let j=0; j<lenDiv; j++) {
			/** @type {vec3[]} */
			let tempVer = [];
			for (let i=0; i<rotDiv; i++) {
				let th = 2 * Math.PI * i / rotDiv;
				let x = Math.cos(th) * 0.5;
				let z = Math.sin(th) * 0.5;
				tempVer.push(new vec3(x, 0, z));
			}
			this.#ver.push(tempVer);
		}
		this.#idx = [];
		for (let j=0; j<lenDiv-1; j++) {
			let ofsBottom = rotDiv*j;
			let ofsTop = rotDiv*(j+1);
			for (let il=0; il<rotDiv; il++) {
				let ir = (il+1) % rotDiv;
				let bl = ofsBottom + il;
				let br = ofsBottom + ir;
				let tl = ofsTop + il;
				let tr = ofsTop + ir;
				this.#idx.push(br, bl, tl);
				this.#idx.push(tl, tr, br);
			}
		}
	}

	/**
	 * @param {number} time
	 * @param {qtn} q
	 */
	addRot(time, q) {
		let t = new _transform();
		t.time = time;
		t.rot = new qtn();
		t.rot.setFrom(q);
		this.#rotList.push(t);
	}

	/**
	 * @param {number} time
	 * @param {number} w
	 * @param {number} h
	 */
	addScale(time, w, h) {
		let t = new _transform();
		t.time = time;
		t.scale = new vec3(w, 1, h);
		this.#scaleList.push(t);
	}

	/**
	 * @param {number} time
	 * @param {number} dx
	 * @param {number} dy
	 * @param {number} dz
	 */
	addTranslate(time, dx, dy, dz) {
		let t = new _transform();
		t.time = time;
		t.translate = new vec3(dx, dy, dz);
		this.#transList.push(t);
	}

	/**
	 * オブジェクトを作成
	 * @param {string} name
	 * @param {Color} color
	 */
	createObject(name="", color=Color.GREEN) {
		let group = new Group(name, 0);
		group.usemtl = name;
		group.kd.setFrom(color);
		group.ka.setFrom(color.light(0.3));
		group.ks.setFrom(Color.WHITE);
		group.ns = 20;
		group.indexCount = this.#idx.length;

		let retModel = new Model();
		retModel.grp.push(group);

		let timeMax = this.#ver[0].length-1;

		// スケーリング
		for (let t=0; t<=timeMax; t++) {
			let scale = this.#getScale(t / timeMax);
			let outline = this.#ver[t];
			for (let i=0; i<outline.length; i++) {
				let v = outline[i];
				v.x *= scale.x;
				v.z *= scale.z;
			}
		}
		// 回転
		for (let t=0; t<=timeMax; t++) {
			let rot = this.#getRot(t / timeMax);
			let outline = this.#ver[t];
			for (let i=0; i<outline.length; i++) {
				let v = outline[i];
				rot.rotVec3(v, v);
			}
		}
		// 平行移動
		for (let t=0; t<=timeMax; t++) {
			let trans = this.#getTrans(t / timeMax);
			let outline = this.#ver[t];
			for (let i=0; i<outline.length; i++) {
				let v = outline[i];
				retModel.ver.push(v.x + trans.x, v.y + trans.y, v.z + trans.z);
			}
		}
		// インデックス
		for (let i=0; i<this.#idx.length; i++) {
			retModel.idx.push(this.#idx[i]);
		}
		return retModel;
	}

	/**
	 * @param {number} time
	 * @returns {vec3}
	 */
	#getScale(time) {
		let list = this.#scaleList;
		let ixMax = list.length-1;
		for (let i=0; i<=ixMax; i++) {
			let a = list[i];
			let b = list[Math.min(i+1, ixMax)];
			if (a.time <= time && b.time >= time) {
				let a2b = (time - a.time) / (b.time - a.time);
				let sa = a.scale.scale(1-a2b);
				let sb = b.scale.scale(a2b);
				return sa.add(sb);
			}
		}
	}

	/**
	 * @param {number} time
	 * @returns {qtn}
	 */
	#getRot(time) {
		let list = this.#rotList;
		let ixMax = list.length-1;
		for (let i=0; i<=ixMax; i++) {
			let a = list[i];
			let b = list[Math.min(i+1, ixMax)];
			if (a.time <= time && b.time >= time) {
				let a2b = (time - a.time) / (b.time - a.time);
				let q = new qtn();
				q.setSlerp(a.rot, b.rot, a2b);
				return q;
			}
		}
	}

	/**
	 * @param {number} time
	 * @returns {vec3}
	 */
	#getTrans(time) {
		let list = this.#transList;
		let ixMax = list.length-1;
		for (let i=0; i<=ixMax; i++) {
			let a = list[i];
			let b = list[Math.min(i+1, ixMax)];
			if (a.time <= time && b.time >= time) {
				let a2b = (time - a.time) / (b.time - a.time);
				let ta = a.translate.scale(1-a2b);
				let tb = b.translate.scale(a2b);
				return ta.add(tb);
			}
		}
	}
}
