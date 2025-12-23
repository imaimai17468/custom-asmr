"use client";

import { AlertCircle, Headphones, Volume2, Waves } from "lucide-react";
import { useCallback, useState } from "react";
import { AudioControls } from "@/components/features/audio-controls/AudioControls";
import { PositionPad } from "@/components/features/position-pad/PositionPad";
import { YouTubePlayer } from "@/components/features/youtube-player/YouTubePlayer";
import { useSpatialAudio } from "@/hooks/use-spatial-audio";
import { useTabAudioCapture } from "@/hooks/use-tab-audio-capture";

export default function Home() {
	const [_isPlayerReady, setIsPlayerReady] = useState(false);

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

	// プレイヤー準備完了
	const handlePlayerReady = useCallback(() => {
		setIsPlayerReady(true);
	}, []);

	return (
		<div className="space-y-8 pb-16">
			{/* ヒーローセクション */}
			<section className="space-y-4 text-center">
				<div className="flex items-center justify-center gap-3">
					<div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3">
						<Headphones className="h-8 w-8 text-white" />
					</div>
					<h1 className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text font-bold text-4xl text-transparent dark:from-violet-400 dark:to-purple-400">
						Custom ASMR
					</h1>
				</div>
				<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
					YouTubeの動画を3D音響に変換。
					<br className="sm:hidden" />
					音源の位置を自由にコントロールして、没入感のある体験を。
				</p>
			</section>

			{/* 特徴 */}
			<section className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center">
					<Waves className="h-6 w-6 text-violet-500" />
					<span className="font-medium text-sm">3D空間音響</span>
					<span className="text-muted-foreground text-xs">
						HRTFによる自然な定位
					</span>
				</div>
				<div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center">
					<Volume2 className="h-6 w-6 text-violet-500" />
					<span className="font-medium text-sm">リアルタイム処理</span>
					<span className="text-muted-foreground text-xs">
						ブラウザ内で完結
					</span>
				</div>
				<div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center">
					<Headphones className="h-6 w-6 text-violet-500" />
					<span className="font-medium text-sm">直感的な操作</span>
					<span className="text-muted-foreground text-xs">
						ドラッグで位置調整
					</span>
				</div>
			</section>

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
				{/* 左カラム: YouTube プレイヤー */}
				<div className="space-y-6">
					<YouTubePlayer onPlayerReady={handlePlayerReady} />
				</div>

				{/* 右カラム: コントロール */}
				<div className="space-y-6">
					{/* 音響コントロール */}
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

					{/* 位置パッド */}
					<PositionPad
						onPositionChange={handlePositionChange}
						disabled={spatialStatus !== "active"}
						initialPosition={{ x: 0, y: 0.5 }}
					/>
				</div>
			</section>

			{/* 注意事項 */}
			<section className="mx-auto max-w-3xl">
				<div className="rounded-lg border bg-muted/30 p-6">
					<h2 className="mb-4 font-semibold text-lg">ご利用にあたって</h2>
					<ul className="space-y-2 text-muted-foreground text-sm">
						<li className="flex items-start gap-2">
							<span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
							<span>
								ヘッドホンまたはイヤホンの使用を推奨します。3D音響の効果を最大限に体験できます。
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
							<span>
								タブ共有を許可する際は、「タブの音声を共有」オプションを有効にしてください。
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
							<span>
								音声データはブラウザ内でのみ処理され、外部に送信されることはありません。
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
							<span>
								YouTube側の音量は自動的に下げられますが、必要に応じて調整してください。
							</span>
						</li>
					</ul>
				</div>
			</section>
		</div>
	);
}
