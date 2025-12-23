import { useCallback, useEffect, useRef, useState } from "react";

// キャプチャの状態
export type CaptureStatus =
	| "idle" // 初期状態
	| "requesting" // 許可リクエスト中
	| "capturing" // キャプチャ中
	| "error"; // エラー

// エラーの種類
export type CaptureError =
	| "not-supported" // ブラウザ非対応
	| "permission-denied" // ユーザーが拒否
	| "no-audio" // 音声トラックなし
	| "unknown"; // その他のエラー

interface UseTabAudioCaptureResult {
	// 状態
	status: CaptureStatus;
	error: CaptureError | null;
	errorMessage: string | null;
	stream: MediaStream | null;

	// 操作
	startCapture: () => Promise<MediaStream | null>;
	stopCapture: () => void;

	// ブラウザ対応チェック
	isSupported: boolean;
}

// エラーメッセージのマッピング
function getErrorMessage(error: CaptureError): string {
	switch (error) {
		case "not-supported":
			return "このブラウザはタブ音声キャプチャに対応していません。Chrome または Edge をお使いください。";
		case "permission-denied":
			return "タブの共有が拒否されました。3D音響を使用するには、タブの共有を許可してください。";
		case "no-audio":
			return "音声トラックが取得できませんでした。タブを選択する際に「タブの音声を共有する」を有効にしてください。";
		case "unknown":
			return "予期しないエラーが発生しました。";
	}
}

/**
 * タブの音声をキャプチャするためのカスタムhook
 *
 * getDisplayMedia APIを使用して、現在のタブまたは他のタブの音声を取得します。
 * キャプチャした音声はMediaStreamとして返され、Web Audio APIで処理できます。
 */
export function useTabAudioCapture(): UseTabAudioCaptureResult {
	const [status, setStatus] = useState<CaptureStatus>("idle");
	const [error, setError] = useState<CaptureError | null>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	// SSRとクライアントで一致させるため、初期値はtrueにしてクライアントでチェック
	const [isSupported, setIsSupported] = useState(true);

	const streamRef = useRef<MediaStream | null>(null);

	// ブラウザ対応チェック（クライアントサイドでのみ実行）
	useEffect(() => {
		const supported =
			typeof window !== "undefined" &&
			typeof navigator !== "undefined" &&
			"mediaDevices" in navigator &&
			"getDisplayMedia" in navigator.mediaDevices;
		setIsSupported(supported);
	}, []);

	// キャプチャを開始
	const startCapture = useCallback(async (): Promise<MediaStream | null> => {
		// ブラウザ対応チェック
		if (!isSupported) {
			setStatus("error");
			setError("not-supported");
			return null;
		}

		// 既にキャプチャ中の場合は既存のストリームを返す
		if (streamRef.current) {
			return streamRef.current;
		}

		setStatus("requesting");
		setError(null);

		try {
			// getDisplayMediaで画面共有を要求
			// suppressLocalAudioPlayback: true で共有タブの元音声を抑制
			// Web Audio APIで処理した音声のみが出力される
			const mediaStream = await navigator.mediaDevices.getDisplayMedia({
				audio: {
					// @ts-expect-error - suppressLocalAudioPlaybackはChrome固有のオプション
					suppressLocalAudioPlayback: true,
				},
				video: true,
			});

			// 音声トラックを確認
			const audioTracks = mediaStream.getAudioTracks();

			if (audioTracks.length === 0) {
				// 音声トラックがない場合
				mediaStream.getTracks().forEach((track) => track.stop());
				setStatus("error");
				setError("no-audio");
				return null;
			}

			// トラック終了時のハンドリング（ユーザーが共有を停止した場合）
			audioTracks[0].addEventListener("ended", () => {
				setStatus("idle");
				setStream(null);
				streamRef.current = null;
			});

			// 元のストリームをそのまま使用（音声トラックが含まれている）
			streamRef.current = mediaStream;
			setStream(mediaStream);
			setStatus("capturing");

			return mediaStream;
		} catch (err) {
			// エラーハンドリング
			if (err instanceof Error) {
				if (
					err.name === "NotAllowedError" ||
					err.name === "PermissionDeniedError"
				) {
					setError("permission-denied");
				} else if (err.name === "NotFoundError") {
					setError("no-audio");
				} else {
					setError("unknown");
				}
			} else {
				setError("unknown");
			}

			setStatus("error");
			return null;
		}
	}, [isSupported]);

	// キャプチャを停止
	const stopCapture = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		setStream(null);
		setStatus("idle");
		setError(null);
	}, []);

	return {
		status,
		error,
		errorMessage: error ? getErrorMessage(error) : null,
		stream,
		startCapture,
		stopCapture,
		isSupported,
	};
}
