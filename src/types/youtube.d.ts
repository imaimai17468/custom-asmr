/**
 * YouTube IFrame Player API の型定義
 */

// プレイヤーの状態定数
declare namespace YT {
	enum PlayerState {
		UNSTARTED = -1,
		ENDED = 0,
		PLAYING = 1,
		PAUSED = 2,
		BUFFERING = 3,
		CUED = 5,
	}

	// プレイヤーオプション
	interface PlayerOptions {
		height?: string | number;
		width?: string | number;
		videoId?: string;
		playerVars?: PlayerVars;
		events?: Events;
	}

	// プレイヤー変数（パラメータ）
	interface PlayerVars {
		autoplay?: 0 | 1;
		cc_lang_pref?: string;
		cc_load_policy?: 0 | 1;
		color?: "red" | "white";
		controls?: 0 | 1;
		disablekb?: 0 | 1;
		enablejsapi?: 0 | 1;
		end?: number;
		fs?: 0 | 1;
		hl?: string;
		iv_load_policy?: 1 | 3;
		list?: string;
		listType?: "playlist" | "user_uploads";
		loop?: 0 | 1;
		modestbranding?: 0 | 1;
		origin?: string;
		playlist?: string;
		playsinline?: 0 | 1;
		rel?: 0 | 1;
		start?: number;
		widget_referrer?: string;
	}

	// イベントハンドラー
	interface Events {
		onReady?: (event: PlayerEvent) => void;
		onStateChange?: (event: OnStateChangeEvent) => void;
		onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void;
		onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void;
		onError?: (event: OnErrorEvent) => void;
		onApiChange?: (event: PlayerEvent) => void;
	}

	// イベントオブジェクト
	interface PlayerEvent {
		target: Player;
	}

	interface OnStateChangeEvent extends PlayerEvent {
		data: PlayerState;
	}

	interface OnPlaybackQualityChangeEvent extends PlayerEvent {
		data: string;
	}

	interface OnPlaybackRateChangeEvent extends PlayerEvent {
		data: number;
	}

	interface OnErrorEvent extends PlayerEvent {
		data: number;
	}

	// プレイヤークラス
	class Player {
		constructor(elementId: string | HTMLElement, options: PlayerOptions);

		// 再生コントロール
		playVideo(): void;
		pauseVideo(): void;
		stopVideo(): void;
		seekTo(seconds: number, allowSeekAhead?: boolean): void;

		// 音量コントロール
		mute(): void;
		unMute(): void;
		isMuted(): boolean;
		setVolume(volume: number): void;
		getVolume(): number;

		// プレイヤー情報
		getPlayerState(): PlayerState;
		getCurrentTime(): number;
		getDuration(): number;
		getVideoUrl(): string;
		getVideoEmbedCode(): string;

		// 動画ロード
		loadVideoById(videoId: string, startSeconds?: number): void;
		loadVideoByUrl(mediaContentUrl: string, startSeconds?: number): void;
		cueVideoById(videoId: string, startSeconds?: number): void;
		cueVideoByUrl(mediaContentUrl: string, startSeconds?: number): void;

		// DOM操作
		getIframe(): HTMLIFrameElement;
		destroy(): void;
	}
}

// Windowインターフェースの拡張
interface Window {
	YT: typeof YT;
	onYouTubeIframeAPIReady: () => void;
}
