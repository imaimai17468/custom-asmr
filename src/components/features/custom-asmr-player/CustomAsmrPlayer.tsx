"use client";

import { AlertCircle } from "lucide-react";
import { useCallback } from "react";
import { AudioControls } from "./audio-controls/AudioControls";
import { useSpatialAudio } from "./hooks/use-spatial-audio";
import { useTabAudioCapture } from "./hooks/use-tab-audio-capture";
import { PositionPad } from "./position-pad/PositionPad";

/**
 * Custom ASMRのメインプレイヤーコンポーネント
 *
 * 状態管理を担当するクライアントコンテナコンポーネント。
 * タブ音声キャプチャと3D空間音響の統合を行う。
 */
export function CustomAsmrPlayer() {
	// タブ音声キャプチャ
	const {
		status: captureStatus,
		errorMessage: captureError,
		isSupported,
		startCapture,
		stopCapture,
	} = useTabAudioCapture();

	// 3D空間音響
	const {
		status: spatialStatus,
		gain,
		initialize,
		connectStream,
		disconnectStream,
		setPosition,
		setGain,
		cleanup,
	} = useSpatialAudio();

	// 3D音響を開始
	const handleStart = useCallback(async () => {
		// 空間音響エンジンを初期化
		const initialized = await initialize();
		if (!initialized) return;

		// タブ音声をキャプチャ
		const stream = await startCapture();
		if (!stream) return;

		// ストリームを接続
		connectStream(stream);
	}, [initialize, startCapture, connectStream]);

	// 3D音響を停止
	const handleStop = useCallback(() => {
		disconnectStream();
		stopCapture();
		cleanup();
	}, [disconnectStream, stopCapture, cleanup]);

	// 音源位置を更新
	const handlePositionChange = useCallback(
		(x: number, y: number) => {
			setPosition(x, y, 0);
		},
		[setPosition],
	);

	return (
		<>
			{/* ブラウザ互換性の警告 */}
			{!isSupported && (
				<div className="mx-auto max-w-3xl rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
					<div className="flex items-start gap-3">
						<AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
						<div>
							<p className="font-medium text-yellow-800 dark:text-yellow-200">
								ブラウザの互換性について
							</p>
							<p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
								タブ音声キャプチャ機能は Chrome または Edge
								で最も安定して動作します。
								他のブラウザでは一部機能が制限される場合があります。
							</p>
						</div>
					</div>
				</div>
			)}

			{/* メインコンテンツ */}
			<section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
				{/* 左カラム: 音響コントロール */}
				<AudioControls
					captureStatus={captureStatus}
					captureError={captureError}
					isSupported={isSupported}
					spatialStatus={spatialStatus}
					gain={gain}
					onGainChange={setGain}
					onStart={handleStart}
					onStop={handleStop}
				/>

				{/* 右カラム: 位置パッド */}
				<PositionPad
					onPositionChange={handlePositionChange}
					disabled={spatialStatus !== "active"}
					initialPosition={{ x: 0, y: 0.5 }}
				/>
			</section>
		</>
	);
}
