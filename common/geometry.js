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
	index;
	/** @type {vec3} */
	value = null;
	/** @type {qtn} */
	rot = null;
}

/**
 * 板状オブジェクト
 */
class Plate {
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
		Plate.#rotTrans(line, angle, x, y);
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
		Plate.#rotTrans(line, angle, x, y);
		this.#lines.push(line);
	}

	/**
	 * モデルを作成
	 * @param {number} bottom
	 * @param {number} height
	 * @param {string} name
	 * @param {Color} color
	 */
	createModel(bottom, height, name="", color=Color.GREEN) {
		/** @type {number[][]} */
		let indexesBottom = [];
		/** @type {number[][]} */
		let indexesTop = [];
		/** @type {vec2[]} */
		let tempVerts = [];
		let indexOfs = 0;

		let group = new Group(name, 0);
		group.usemtl = name;
		group.kd.copyFrom(color);
		group.ka.copyFrom(color.light(0.3));
		group.ks.copyFrom(Color.WHITE);
		group.ni = 1.75;
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
		Plate.#margeLines(tempVerts, indexesBottom, BOTTOM_ORDER);
		Plate.#margeLines(tempVerts, indexesTop, TOP_ORDER);

		// 底面を出力
		for (let i = 0; i < indexesBottom.length; i++) {
			let index = indexesBottom[i];
			if (0 == index.length) {
				continue;
			}
			/** @type {_face[]} */
			let s = [];
			Plate.#createPolygon(tempVerts, index, s, BOTTOM_ORDER);
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
			Plate.#createPolygon(tempVerts, index, s, TOP_ORDER);
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

		let oa = new vec2();
		let ob = new vec2();

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
				oa.sub(va, vo);
				ob.sub(vb, vo);
				let aobNormal = oa.cross(ob) * order;
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
					if (Plate.#hasInnerPoint(va, vo, vb, p)) {
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
		let aox = o.x - a.x;
		let aoy = o.y - a.y;
		let obx = b.x - o.x;
		let oby = b.y - o.y;
		let bax = a.x - b.x;
		let bay = a.y - b.y;
		let apx = p.x - a.x;
		let apy = p.y - a.y;
		let opx = p.x - o.x;
		let opy = p.y - o.y;
		let bpx = p.x - b.x;
		let bpy = p.y - b.y;
		let oapNormal = aox*apy - aoy*apx;
		let bopNormal = obx*opy - oby*opx;
		let abpNormal = bax*bpy - bay*bpx;
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
				if (Plate.#hasInnerPoint(outerA, outerO, outerB, innerA)) {
					return true;
				}
				if (Plate.#hasInnerPoint(outerA, outerO, outerB, innerO)) {
					return true;
				}
				if (Plate.#hasInnerPoint(outerA, outerO, outerB, innerB)) {
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
				let outerS = Plate.#createPolygon(vertex, indexes[ixOuter], outerSurf, order);
				let innerS = Plate.#createPolygon(vertex, indexes[ixInner], innerSurf, order);
				if (innerS < outerS && Plate.#hasInnerPolygon(outerSurf, innerSurf, vertex)) {
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
	 * @param {vec2[]} vert
	 * @param {number} angle
	 * @param {number} tx
	 * @param {number} ty
	 */
	static #rotTrans(vert, angle, tx, ty) {
		var rotX = Math.cos(angle);
		var rotY = Math.sin(angle);
		for (let i=0; i<vert.length; i++) {
			var v = vert[i];
			var rx = v.x * rotX - v.y * rotY;
			var ry = v.x * rotY + v.y * rotX;
			v.x = rx + tx;
			v.y = ry + ty;
		}
	}
}

/**
 * 筒状オブジェクト
 */
class Cylinder {
	/**
	 * 回転量
	 * @type {qtn}
	 */
	rotation;

	/**
	 * 平行移動量
	 * @type {vec3}
	 */
	translate;

	/** @type {_transform[]} */
	#scaleList;
	/** @type {_transform[]} */
	#rotList;
	/** @type {_transform[]} */
	#posList;
	/** @type {number} */
	#indexMax;
	/** @type {number} */
	#rotDivCount;
	/** @type {vec3[][]} */
	#vertex;
	/** @type {number[]} */
	#index;

	/**
	 * 筒状オブジェクトを作成
	 * @param {number} divCount 断面数
	 * @param {number} rotDivCount 断面の回転分割数
	 * @param {boolean} jointTerm 始端と終端をつなぐかどうか
	 * @param {boolean} fillStart 始端を塞ぐかどうか
	 * @param {boolean} fillEnd 終端を塞ぐかどうか
	 */
	constructor(divCount, rotDivCount, jointTerm=false, fillStart=false, fillEnd=false) {
		this.rotation = new qtn();
		this.rotation.setRot([0,1,0], 0);
		this.translate = new vec3();
		this.#scaleList = [];
		this.#rotList = [];
		this.#posList = [];
		this.#indexMax = divCount - 1;
		this.#rotDivCount = rotDivCount;
		this.#createVertex();
		this.#createIndex(jointTerm, fillStart, fillEnd);
	}

	/**
	 * 断面のスケール設定をクリア
	 */
	clearScale() {
		this.#scaleList = [];
	}

	/**
	 * 断面のスケールを設定
	 * @param {number} index 対象断面のインデックス(0:始端～断面数-1:終端)
	 * @param {number} w
	 * @param {number} h
	 */
	addScale(index, w, h) {
		let t = new _transform();
		t.index = index;
		t.value = new vec3(w, h, 1);
		this.#scaleList.push(t);
	}

	/**
	 * 断面のスケールを設定
	 * @param {number} time 断面の位置(0:始端～1:終端)
	 * @param {number} w
	 * @param {number} h
	 */
	addScaleAtTime(time, w, h) {
		let t = new _transform();
		t.index = time*this.#indexMax;
		t.value = new vec3(w, h, 1);
		this.#scaleList.push(t);
	}

	/**
	 * 断面の回転量設定をクリア
	 */
	clearRot() {
		this.#rotList = [];
	}

	/**
	 * 断面の回転量を設定
	 * @param {number} index 対象断面のインデックス(0:始端～断面数-1:終端)
	 * @param {qtn} q
	 */
	addRot(index, q) {
		let t = new _transform();
		t.index = index;
		t.rot = new qtn();
		t.rot.copyFrom(q);
		this.#rotList.push(t);
	}

	/**
	 * 断面の回転量を設定
	 * @param {number} time 断面の位置(0:始端～1:終端)
	 * @param {qtn} q
	 */
	addRotAtTime(time, q) {
		let t = new _transform();
		t.index = time*this.#indexMax;
		t.rot = new qtn();
		t.rot.copyFrom(q);
		this.#rotList.push(t);
	}

	/**
	 * 断面の中心位置設定をクリア
	 */
	clearPos() {
		this.#posList = [];
	}

	/**
	 * 断面の中心位置を設定
	 * @param {number} index 対象断面のインデックス(0:始端～断面数-1:終端)
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	addPos(index, x, y, z) {
		let t = new _transform();
		t.index = index;
		t.value = new vec3(x, y, z);
		this.#posList.push(t);
	}

	/**
	 * 断面の中心位置を設定
	 * @param {number} time 断面の位置(0:始端～1:終端)
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	addPosAtTime(time, x, y, z) {
		let t = new _transform();
		t.index = time*this.#indexMax;
		t.value = new vec3(x, y, z);
		this.#posList.push(t);
	}

	/**
	 * モデルを作成
	 * @param {string} name
	 * @param {Color} color
	 */
	createModel(name="", color=Color.GREEN) {
		let retModel = new Model();

		let group = new Group(name, 0);
		group.usemtl = name;
		group.kd.copyFrom(color);
		group.ka.copyFrom(color.light(0.3));
		group.ks.copyFrom(Color.WHITE);
		group.ni = 1.75;
		group.ns = 20;
		group.indexCount = this.#index.length;
		retModel.grp.push(group);

		for (let i=0; i<this.#index.length; i++) {
			retModel.idx.push(this.#index[i]);
		}

		for (let j=0; j<=this.#indexMax; j++) {
			let scale = this.#getScale(j);
			let rot = this.#getRot(j);
			let pos = this.#getPos(j);
			let outline = this.#vertex[j];
			let p = new vec3();
			for (let i=0; i<outline.length; i++) {
				p.copyFrom(outline[i]);
				p.hadamard(scale);
				rot.apply(p, p);
				p.add(p, pos);
				this.rotation.apply(p, p);
				p.add(p, this.translate);
				retModel.ver.push(p.x, p.y, p.z);
			}
		}

		return retModel;
	}

	/**
	 * @param {number} index
	 * @returns {vec3}
	 */
	#getScale(index) {
		let list = this.#scaleList;
		let ixMax = list.length-1;
		let ret = new vec3();
		let sa = new vec3();
		let sb = new vec3();
		for (let i=0; i<=ixMax; i++) {
			let a = list[i];
			let b = list[Math.min(i+1, ixMax)];
			if (a.index <= index && b.index >= index) {
				let a2b = (index - a.index) / (b.index - a.index);
				sa.copyFrom(a.value);
				sa.scale(1-a2b);
				sb.copyFrom(b.value);
				sb.scale(a2b);
				ret.add(sa, sb);
				return ret;
			}
		}
	}

	/**
	 * @param {number} index
	 * @returns {qtn}
	 */
	#getRot(index) {
		let list = this.#rotList;
		let ixMax = list.length-1;
		for (let i=0; i<=ixMax; i++) {
			let a = list[i];
			let b = list[Math.min(i+1, ixMax)];
			if (a.index <= index && b.index >= index) {
				let a2b = (index - a.index) / (b.index - a.index);
				let q = new qtn();
				q.setSlerp(a.rot, b.rot, a2b);
				return q;
			}
		}
	}

	/**
	 * @param {number} index
	 * @returns {vec3}
	 */
	#getPos(index) {
		let list = this.#posList;
		let ixMax = list.length-1;
		let pa = new vec3();
		let pb = new vec3();
		let ret = new vec3();
		for (let i=0; i<=ixMax; i++) {
			let a = list[i];
			let b = list[Math.min(i+1, ixMax)];
			if (a.index <= index && b.index >= index) {
				let a2b = (index - a.index) / (b.index - a.index);
				pa.copyFrom(a.value);
				pa.scale(1-a2b);
				pb.copyFrom(b.value);
				pb.scale(a2b);
				ret.add(pa, pb);
				return ret;
			}
		}
	}

	#createVertex() {
		this.#vertex = [];
		for (let j=0; j<=this.#indexMax; j++) {
			/** @type {vec3[]} */
			let outline = [];
			for (let i=0; i<this.#rotDivCount; i++) {
				let th = -2 * Math.PI * i / this.#rotDivCount;
				let x = Math.cos(th) * 0.5;
				let y = Math.sin(th) * 0.5;
				outline.push(new vec3(x, y, 0));
			}
			this.#vertex.push(outline);
		}
	}

	/**
	 * @param {boolean} jointTerm
	 * @param {boolean} fillStart
	 * @param {boolean} fillEnd
	 */
	#createIndex(jointTerm, fillStart, fillEnd) {
		this.#index = [];
		let divCount = this.#indexMax + 1;
		let lastDiv = jointTerm ? divCount : this.#indexMax;
		for (let j=0; j<lastDiv; j++) {
			let ofsBottom = this.#rotDivCount*j;
			let ofsTop = this.#rotDivCount*((j+1)%divCount);
			for (let il=0; il<this.#rotDivCount; il++) {
				let ir = (il+1) % this.#rotDivCount;
				let bl = ofsBottom + il;
				let br = ofsBottom + ir;
				let tl = ofsTop + il;
				let tr = ofsTop + ir;
				this.#index.push(br, bl, tl);
				this.#index.push(tl, tr, br);
			}
		}
		if (fillStart) {
			let ofsTop = this.#rotDivCount - 1;
			let divH = this.#rotDivCount >> 1;
			for (let bl=0,br=1; bl<divH; bl++,br++) {
				let tl = ofsTop - bl;
				let tr = ofsTop - br;
				this.#index.push(tl, bl, br);
				this.#index.push(br, tr, tl);
			}
		}
		if (fillEnd) {
			let ofsBottom = this.#rotDivCount*this.#indexMax;
			let ofsTop = ofsBottom + this.#rotDivCount - 1;
			let divH = this.#rotDivCount >> 1;
			for (let il=0,ir=1; il<divH; il++,ir++) {
				let bl = ofsBottom + il;
				let br = ofsBottom + ir;
				let tl = ofsTop - il;
				let tr = ofsTop - ir;
				this.#index.push(br, bl, tl);
				this.#index.push(tl, tr, br);
			}
		}
	}
}
