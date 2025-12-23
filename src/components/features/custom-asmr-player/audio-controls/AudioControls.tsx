"use client";

import {
	AlertCircle,
	Headphones,
	Loader2,
	MonitorSpeaker,
	Volume2,
	VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { SpatialAudioStatus } from "../hooks/use-spatial-audio";
import type { CaptureStatus } from "../hooks/use-tab-audio-capture";

interface AudioControlsProps {
	// キャプチャ状態
	captureStatus: CaptureStatus;
	captureError: string | null;
	isSupported: boolean;

	// 空間音響状態
	spatialStatus: SpatialAudioStatus;

	// 音量
	gain: number;
	onGainChange?: (value: number) => void;

	// 操作
	onStart?: () => void;
	onStop?: () => void;

	className?: string;
}

// 状態に応じたステータステキスト
function getStatusText(
	captureStatus: CaptureStatus,
	spatialStatus: SpatialAudioStatus,
): string {
	if (captureStatus === "error") return "エラー";
	if (captureStatus === "requesting") return "許可を待っています...";
	if (spatialStatus === "initializing") return "初期化中...";
	if (spatialStatus === "active") return "3D音響有効";
	if (spatialStatus === "ready") return "準備完了";
	return "待機中";
}

// 状態に応じたアイコン
function StatusIcon({
	captureStatus,
	spatialStatus,
}: {
	captureStatus: CaptureStatus;
	spatialStatus: SpatialAudioStatus;
}) {
	if (captureStatus === "error") {
		return <AlertCircle className="h-4 w-4 text-destructive" />;
	}
	if (captureStatus === "requesting" || spatialStatus === "initializing") {
		return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
	}
	if (spatialStatus === "active") {
		return <Headphones className="h-4 w-4 text-green-500" />;
	}
	return <MonitorSpeaker className="h-4 w-4 text-muted-foreground" />;
}

export function AudioControls({
	captureStatus,
	captureError,
	isSupported,
	spatialStatus,
	gain,
	onGainChange,
	onStart,
	onStop,
	className,
}: AudioControlsProps) {
	const isActive = spatialStatus === "active";
	const isLoading =
		captureStatus === "requesting" || spatialStatus === "initializing";
	const canStart = isSupported && !isActive && !isLoading;
	const canStop = isActive;

	const handleGainChange = (values: number[]) => {
		onGainChange?.(values[0]);
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Headphones className="h-5 w-5" />
					3D 音響コントロール
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* ステータス表示 */}
				<div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
					<div className="flex items-center gap-2">
						<StatusIcon
							captureStatus={captureStatus}
							spatialStatus={spatialStatus}
						/>
						<span className="font-medium text-sm">
							{getStatusText(captureStatus, spatialStatus)}
						</span>
					</div>
					{isActive && (
						<div className="flex items-center gap-1">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
							</span>
						</div>
					)}
				</div>

				{/* エラーメッセージ */}
				{captureError && (
					<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
						<p className="text-destructive text-sm">{captureError}</p>
					</div>
				)}

				{/* ブラウザ非対応警告 */}
				{!isSupported && (
					<div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
						<p className="text-sm text-yellow-700 dark:text-yellow-400">
							このブラウザはタブ音声キャプチャに対応していません。
							<br />
							Chrome または Edge をお使いください。
						</p>
					</div>
				)}

				{/* 開始/停止ボタン */}
				<div className="flex gap-3">
					<Button
						onClick={onStart}
						disabled={!canStart}
						className={cn("flex-1", isLoading && "animate-pulse")}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								準備中...
							</>
						) : (
							<>
								<Headphones className="mr-2 h-4 w-4" />
								3D音響を開始
							</>
						)}
					</Button>
					<Button
						onClick={onStop}
						disabled={!canStop}
						variant="outline"
						className="flex-1"
					>
						停止
					</Button>
				</div>

				{/* 音量スライダー */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="flex items-center gap-2 font-medium text-sm">
							{gain > 0 ? (
								<Volume2 className="h-4 w-4" />
							) : (
								<VolumeX className="h-4 w-4" />
							)}
							3D音響の音量
						</span>
						<span className="font-mono text-muted-foreground text-sm">
							{Math.round(gain * 100)}%
						</span>
					</div>
					<Slider
						value={[gain]}
						onValueChange={handleGainChange}
						min={0}
						max={1}
						step={0.01}
						disabled={!isActive}
						className="w-full"
						aria-label="3D音響の音量"
					/>
				</div>

				{/* 使い方の説明 */}
				<div className="space-y-2 border-t pt-4 text-muted-foreground text-xs">
					<p className="font-medium">使い方:</p>
					<ol className="list-inside list-decimal space-y-1">
						<li>別タブでYouTube動画を開いて再生</li>
						<li>このタブに戻り「3D音響を開始」をクリック</li>
						<li>タブ共有ダイアログでYouTubeのタブを選択</li>
						<li>「タブの音声を共有」にチェック</li>
						<li>パッドで音源の位置を調整</li>
					</ol>
				</div>
			</CardContent>
		</Card>
	);
}
