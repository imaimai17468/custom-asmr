"use client";

import { Loader2, Pause, Play } from "lucide-react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// YouTubeプレイヤーの外部制御用ハンドル
export interface YouTubePlayerHandle {
	mute: () => void;
	unmute: () => void;
	setVolume: (volume: number) => void;
}

// YouTube URLからビデオIDを抽出する
function extractVideoId(url: string): string | null {
	// 対応フォーマット:
	// - https://www.youtube.com/watch?v=VIDEO_ID
	// - https://youtu.be/VIDEO_ID
	// - https://www.youtube.com/embed/VIDEO_ID
	// - VIDEO_ID (直接入力)
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
		/^([a-zA-Z0-9_-]{11})$/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match?.[1]) {
			return match[1];
		}
	}
	return null;
}

// プレイヤーの状態
type PlayerStatus =
	| "idle"
	| "loading"
	| "ready"
	| "playing"
	| "paused"
	| "error";

interface YouTubePlayerProps {
	onPlayerReady?: () => void;
	className?: string;
}

export const YouTubePlayer = forwardRef<
	YouTubePlayerHandle,
	YouTubePlayerProps
>(function YouTubePlayer({ onPlayerReady, className }, ref) {
	const [url, setUrl] = useState("");
	const [videoId, setVideoId] = useState<string | null>(null);
	const [status, setStatus] = useState<PlayerStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	const playerRef = useRef<YT.Player | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const apiLoadedRef = useRef(false);

	// 外部から制御可能なメソッドを公開
	useImperativeHandle(ref, () => ({
		mute: () => {
			playerRef.current?.mute();
		},
		unmute: () => {
			playerRef.current?.unMute();
		},
		setVolume: (volume: number) => {
			playerRef.current?.setVolume(volume);
		},
	}));

	// YouTube IFrame APIを動的にロード
	const loadYouTubeAPI = useCallback(() => {
		return new Promise<void>((resolve) => {
			// 既にロード済みの場合
			if (window.YT?.Player) {
				resolve();
				return;
			}

			// APIがロード中の場合
			if (apiLoadedRef.current) {
				const checkReady = setInterval(() => {
					if (window.YT?.Player) {
						clearInterval(checkReady);
						resolve();
					}
				}, 100);
				return;
			}

			apiLoadedRef.current = true;

			// コールバック関数を設定
			window.onYouTubeIframeAPIReady = () => {
				resolve();
			};

			// スクリプトタグを追加
			const tag = document.createElement("script");
			tag.src = "https://www.youtube.com/iframe_api";
			const firstScriptTag = document.getElementsByTagName("script")[0];
			firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
		});
	}, []);

	// プレイヤーを初期化
	const initializePlayer = useCallback(
		async (id: string) => {
			if (!containerRef.current) return;

			setStatus("loading");
			setError(null);

			try {
				await loadYouTubeAPI();

				// 既存のプレイヤーを破棄
				if (playerRef.current) {
					playerRef.current.destroy();
					playerRef.current = null;
				}

				// プレイヤーコンテナを作成
				const playerElement = document.createElement("div");
				playerElement.id = "youtube-player";
				containerRef.current.innerHTML = "";
				containerRef.current.appendChild(playerElement);

				// 新しいプレイヤーを作成
				playerRef.current = new window.YT.Player("youtube-player", {
					height: "100%",
					width: "100%",
					videoId: id,
					playerVars: {
						playsinline: 1,
						controls: 1,
						rel: 0,
						modestbranding: 1,
					},
					events: {
						onReady: (event) => {
							setStatus("ready");
							// 初期音量を低く設定（3D音響との二重再生を防ぐため）
							event.target.setVolume(10);
							onPlayerReady?.();
						},
						onStateChange: (event) => {
							switch (event.data) {
								case window.YT.PlayerState.PLAYING:
									setStatus("playing");
									break;
								case window.YT.PlayerState.PAUSED:
									setStatus("paused");
									break;
								case window.YT.PlayerState.ENDED:
									setStatus("ready");
									break;
							}
						},
						onError: () => {
							setStatus("error");
							setError("動画の読み込みに失敗しました");
						},
					},
				});
			} catch {
				setStatus("error");
				setError("YouTube APIの読み込みに失敗しました");
			}
		},
		[loadYouTubeAPI, onPlayerReady],
	);

	// URLが変更されたときにビデオIDを抽出
	const handleUrlSubmit = useCallback(() => {
		const id = extractVideoId(url.trim());
		if (id) {
			setVideoId(id);
			initializePlayer(id);
		} else {
			setError("有効なYouTube URLを入力してください");
		}
	}, [url, initializePlayer]);

	// 再生/一時停止の切り替え
	const togglePlayPause = useCallback(() => {
		if (!playerRef.current) return;

		if (status === "playing") {
			playerRef.current.pauseVideo();
		} else {
			playerRef.current.playVideo();
		}
	}, [status]);

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (playerRef.current) {
				playerRef.current.destroy();
			}
		};
	}, []);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Play className="h-5 w-5" />
					YouTube プレイヤー
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* URL入力フォーム */}
				<div className="flex gap-2">
					<Input
						type="text"
						placeholder="YouTube URL を入力..."
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
						className="flex-1"
					/>
					<Button onClick={handleUrlSubmit} disabled={status === "loading"}>
						{status === "loading" ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"読み込み"
						)}
					</Button>
				</div>

				{/* エラーメッセージ */}
				{error && <p className="text-destructive text-sm">{error}</p>}

				{/* プレイヤーコンテナ */}
				<div
					ref={containerRef}
					className="aspect-video w-full overflow-hidden rounded-lg bg-muted"
				>
					{!videoId && (
						<div className="flex h-full items-center justify-center text-muted-foreground">
							動画を読み込むにはURLを入力してください
						</div>
					)}
				</div>

				{/* 再生コントロール */}
				{videoId && status !== "idle" && status !== "loading" && (
					<div className="flex items-center justify-center gap-4">
						<Button
							variant="outline"
							size="icon"
							onClick={togglePlayPause}
							disabled={status === "error"}
						>
							{status === "playing" ? (
								<Pause className="h-4 w-4" />
							) : (
								<Play className="h-4 w-4" />
							)}
						</Button>
						<span className="text-muted-foreground text-sm">
							{status === "playing" && "再生中"}
							{status === "paused" && "一時停止"}
							{status === "ready" && "準備完了"}
							{status === "error" && "エラー"}
						</span>
					</div>
				)}

				{/* 注意書き */}
				{videoId && (
					<p className="text-muted-foreground text-xs">
						※ 3D音響使用時はYouTubeの音量が自動的に下がります
					</p>
				)}
			</CardContent>
		</Card>
	);
});
