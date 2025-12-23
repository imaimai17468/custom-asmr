import { useCallback, useEffect, useRef, useState } from "react";
import {
	closeAudioContext,
	connectAudioGraph,
	createAudioContext,
	createGainNode,
	createMediaStreamSource,
	createPannerNode,
	DEFAULT_CONFIG,
	disconnectAudioGraph,
	type Position3D,
	padToPosition3D,
	resumeAudioContext,
	type SpatialAudioConfig,
	type SpatialAudioNodes,
	setListenerPosition,
	updateGain,
	updateSourcePosition,
} from "../lib/audio/spatial-audio-engine";

// エンジンの状態
export type SpatialAudioStatus =
	| "idle" // 初期状態
	| "initializing" // 初期化中
	| "ready" // 準備完了（ストリーム未接続）
	| "active" // アクティブ（3D音響処理中）
	| "error"; // エラー

interface UseSpatialAudioOptions {
	config?: Partial<SpatialAudioConfig>;
	initialGain?: number;
}

interface UseSpatialAudioResult {
	// 状態
	status: SpatialAudioStatus;
	position: Position3D;
	gain: number;

	// 操作
	initialize: () => Promise<boolean>;
	connectStream: (stream: MediaStream) => void;
	disconnectStream: () => void;
	setPosition: (x: number, y: number, height?: number) => void;
	setGain: (value: number) => void;
	cleanup: () => void;
}

/**
 * 3D空間音響を制御するためのカスタムhook
 */
export function useSpatialAudio(
	options: UseSpatialAudioOptions = {},
): UseSpatialAudioResult {
	const { config = {}, initialGain = 1 } = options;

	const [status, setStatus] = useState<SpatialAudioStatus>("idle");
	const [position, setPositionState] = useState<Position3D>({
		x: 0,
		y: 0,
		z: 1,
	});
	const [gain, setGainState] = useState(initialGain);

	const nodesRef = useRef<SpatialAudioNodes | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	// エンジンを初期化
	const initialize = useCallback(async (): Promise<boolean> => {
		// 既に初期化済みの場合
		if (nodesRef.current) {
			return true;
		}

		setStatus("initializing");

		try {
			// AudioContextを作成
			const context = createAudioContext();
			await resumeAudioContext(context);

			// ノードを作成
			const mergedConfig: SpatialAudioConfig = {
				...DEFAULT_CONFIG,
				...config,
			};

			const panner = createPannerNode(context, mergedConfig);
			const gainNode = createGainNode(context, initialGain);

			// リスナーを設定
			setListenerPosition(context);

			// ノードを保存
			nodesRef.current = {
				context,
				source: null,
				panner,
				gain: gainNode,
			};

			setStatus("ready");
			return true;
		} catch {
			setStatus("error");
			return false;
		}
	}, [config, initialGain]);

	// MediaStreamを接続
	const connectStream = useCallback((stream: MediaStream) => {
		const nodes = nodesRef.current;
		if (!nodes) {
			return;
		}

		// 既存のソースを切断
		if (nodes.source) {
			disconnectAudioGraph(nodes);
		}

		// 新しいソースを作成して接続
		const source = createMediaStreamSource(nodes.context, stream);
		nodes.source = source;
		streamRef.current = stream;

		// オーディオグラフを接続
		connectAudioGraph(nodes);

		setStatus("active");
	}, []);

	// ストリームを切断
	const disconnectStream = useCallback(() => {
		const nodes = nodesRef.current;
		if (!nodes?.source) {
			return;
		}

		disconnectAudioGraph(nodes);
		nodes.source = null;
		streamRef.current = null;

		setStatus("ready");
	}, []);

	// 音源の位置を設定（2Dパッド座標から）
	const setPosition = useCallback((x: number, y: number, height = 0) => {
		const nodes = nodesRef.current;
		if (!nodes) {
			return;
		}

		const pos = padToPosition3D(x, y, height);
		updateSourcePosition(nodes.panner, pos);
		setPositionState(pos);
	}, []);

	// 音量を設定
	const setGain = useCallback((value: number) => {
		const nodes = nodesRef.current;
		if (!nodes) {
			return;
		}

		updateGain(nodes.gain, value);
		setGainState(value);
	}, []);

	// クリーンアップ
	const cleanup = useCallback(() => {
		const nodes = nodesRef.current;
		if (!nodes) {
			return;
		}

		// ストリームを切断
		if (nodes.source) {
			disconnectAudioGraph(nodes);
		}

		// AudioContextを閉じる
		closeAudioContext(nodes.context);

		nodesRef.current = null;
		streamRef.current = null;
		setStatus("idle");
	}, []);

	// コンポーネントのアンマウント時にクリーンアップ
	useEffect(() => {
		return () => {
			if (nodesRef.current) {
				cleanup();
			}
		};
	}, [cleanup]);

	return {
		status,
		position,
		gain,
		initialize,
		connectStream,
		disconnectStream,
		setPosition,
		setGain,
		cleanup,
	};
}
