"use client";

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
			// audio: true で音声も取得
			// video: true も必要（音声のみは一部ブラウザで非対応）
			const mediaStream = await navigator.mediaDevices.getDisplayMedia({
				audio: true,
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

			// ビデオトラックは不要なので停止（音声のみ使用）
			const videoTracks = mediaStream.getVideoTracks();
			videoTracks.forEach((track) => track.stop());

			// 音声トラックのみの新しいストリームを作成
			const audioOnlyStream = new MediaStream(audioTracks);

			// トラック終了時のハンドリング（ユーザーが共有を停止した場合）
			audioTracks[0].addEventListener("ended", () => {
				setStatus("idle");
				setStream(null);
				streamRef.current = null;
			});

			streamRef.current = audioOnlyStream;
			setStream(audioOnlyStream);
			setStatus("capturing");

			return audioOnlyStream;
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
