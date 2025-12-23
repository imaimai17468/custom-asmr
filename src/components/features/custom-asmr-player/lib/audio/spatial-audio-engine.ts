/**
 * Spatial Audio Engine
 *
 * Web Audio APIを使用して3D空間音響を処理するエンジン
 * PannerNode (HRTF) を使用して、音源の位置を3D空間に配置
 */

// 3D空間での位置
export interface Position3D {
	x: number; // 左右 (-1: 左, 1: 右)
	y: number; // 上下 (-1: 下, 1: 上)
	z: number; // 前後 (-1: 後ろ, 1: 前)
}

// エンジンの設定
export interface SpatialAudioConfig {
	// 最大距離（この距離で音量が0になる）
	maxDistance: number;
	// 参照距離（この距離で音量が最大）
	refDistance: number;
	// 減衰係数
	rolloffFactor: number;
	// パニングモデル
	panningModel: PanningModelType;
	// 距離モデル
	distanceModel: DistanceModelType;
}

// デフォルト設定
export const DEFAULT_CONFIG: SpatialAudioConfig = {
	maxDistance: 10,
	refDistance: 1,
	rolloffFactor: 1,
	panningModel: "HRTF",
	distanceModel: "inverse",
};

// エンジンのノード構成
export interface SpatialAudioNodes {
	context: AudioContext;
	source: MediaStreamAudioSourceNode | null;
	panner: PannerNode;
	gain: GainNode;
}

/**
 * AudioContextを作成または再開する
 * ユーザー操作後に呼び出す必要がある
 */
export function createAudioContext(): AudioContext {
	const context = new AudioContext();
	return context;
}

/**
 * AudioContextを再開する（suspended状態から）
 */
export async function resumeAudioContext(context: AudioContext): Promise<void> {
	if (context.state === "suspended") {
		await context.resume();
	}
}

/**
 * PannerNodeを作成し、HRTFで3D空間音響を設定
 */
export function createPannerNode(
	context: AudioContext,
	config: SpatialAudioConfig = DEFAULT_CONFIG,
): PannerNode {
	const panner = context.createPanner();

	// パニングモデル（HRTF = Head-Related Transfer Function）
	panner.panningModel = config.panningModel;

	// 距離モデル
	panner.distanceModel = config.distanceModel;

	// 距離パラメータ
	panner.maxDistance = config.maxDistance;
	panner.refDistance = config.refDistance;
	panner.rolloffFactor = config.rolloffFactor;

	// リスナーの方向性（全方向から聞こえる）
	panner.coneInnerAngle = 360;
	panner.coneOuterAngle = 360;
	panner.coneOuterGain = 0;

	// 初期位置（正面）
	panner.positionX.value = 0;
	panner.positionY.value = 0;
	panner.positionZ.value = 1;

	return panner;
}

/**
 * GainNodeを作成（音量制御用）
 */
export function createGainNode(
	context: AudioContext,
	initialGain = 1,
): GainNode {
	const gain = context.createGain();
	gain.gain.value = initialGain;
	return gain;
}

/**
 * MediaStreamからソースノードを作成
 */
export function createMediaStreamSource(
	context: AudioContext,
	stream: MediaStream,
): MediaStreamAudioSourceNode {
	return context.createMediaStreamSource(stream);
}

/**
 * オーディオグラフを構築
 * Source -> Panner -> Gain -> Destination
 */
export function connectAudioGraph(nodes: SpatialAudioNodes): void {
	if (!nodes.source) return;

	// ノードを接続
	nodes.source.connect(nodes.panner);
	nodes.panner.connect(nodes.gain);
	nodes.gain.connect(nodes.context.destination);
}

/**
 * オーディオグラフを切断
 */
export function disconnectAudioGraph(nodes: SpatialAudioNodes): void {
	if (nodes.source) {
		nodes.source.disconnect();
	}
	nodes.panner.disconnect();
	nodes.gain.disconnect();
}

/**
 * 音源の位置を更新
 * 座標は -1 から 1 の正規化された値
 */
export function updateSourcePosition(
	panner: PannerNode,
	position: Position3D,
	scale = 5,
): void {
	// 正規化された座標をスケーリング
	const x = position.x * scale;
	const y = position.y * scale;
	const z = position.z * scale;

	// 位置を更新（AudioParamを使用してスムーズに変更）
	const currentTime = panner.context.currentTime;
	panner.positionX.setTargetAtTime(x, currentTime, 0.02);
	panner.positionY.setTargetAtTime(y, currentTime, 0.02);
	panner.positionZ.setTargetAtTime(z, currentTime, 0.02);
}

/**
 * 音量を更新
 */
export function updateGain(gain: GainNode, value: number): void {
	const clampedValue = Math.max(0, Math.min(1, value));
	const currentTime = gain.context.currentTime;
	gain.gain.setTargetAtTime(clampedValue, currentTime, 0.02);
}

/**
 * リスナーの位置と向きを設定
 * 通常は原点に配置し、前方を向く
 */
export function setListenerPosition(
	context: AudioContext,
	position: Position3D = { x: 0, y: 0, z: 0 },
	forward: Position3D = { x: 0, y: 0, z: -1 },
	up: Position3D = { x: 0, y: 1, z: 0 },
): void {
	const listener = context.listener;

	// リスナーの位置
	if (listener.positionX) {
		listener.positionX.value = position.x;
		listener.positionY.value = position.y;
		listener.positionZ.value = position.z;
	}

	// リスナーの向き
	if (listener.forwardX) {
		listener.forwardX.value = forward.x;
		listener.forwardY.value = forward.y;
		listener.forwardZ.value = forward.z;
		listener.upX.value = up.x;
		listener.upY.value = up.y;
		listener.upZ.value = up.z;
	}
}

/**
 * AudioContextを閉じる
 */
export async function closeAudioContext(context: AudioContext): Promise<void> {
	await context.close();
}

/**
 * 2D座標（パッドの位置）から3D座標に変換
 * パッドは上が前、下が後ろ、左が左、右が右
 */
export function padToPosition3D(
	padX: number,
	padY: number,
	height = 0,
): Position3D {
	return {
		x: padX, // 左右はそのまま
		y: height, // 高さは別途指定
		z: -padY, // パッドのY（上が+）を3DのZ（前が-）に変換
	};
}
