"use client";

import { Move3d } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Position {
	x: number; // -1 (左) から 1 (右)
	y: number; // -1 (下/後ろ) から 1 (上/前)
}

interface PositionPadProps {
	/** 位置が変更されたときのコールバック */
	onPositionChange?: (x: number, y: number) => void;
	/** 初期位置 */
	initialPosition?: Position;
	/** 無効化状態 */
	disabled?: boolean;
	/** カスタムクラス */
	className?: string;
}

// パッド内の座標をピクセルから正規化座標に変換
function pixelToNormalized(
	pixelX: number,
	pixelY: number,
	width: number,
	height: number,
): Position {
	// 中心を原点とした -1 から 1 の範囲に変換
	const x = (pixelX / width) * 2 - 1;
	const y = -((pixelY / height) * 2 - 1); // Y軸は上が正

	// -1 から 1 の範囲にクランプ
	return {
		x: Math.max(-1, Math.min(1, x)),
		y: Math.max(-1, Math.min(1, y)),
	};
}

// 正規化座標からパーセンテージに変換（CSS用）
function normalizedToPercent(pos: Position): { left: string; top: string } {
	const left = ((pos.x + 1) / 2) * 100;
	const top = ((-pos.y + 1) / 2) * 100;
	return {
		left: `${left}%`,
		top: `${top}%`,
	};
}

export function PositionPad({
	onPositionChange,
	initialPosition = { x: 0, y: 0.5 },
	disabled = false,
	className,
}: PositionPadProps) {
	const [position, setPosition] = useState<Position>(initialPosition);
	const [isDragging, setIsDragging] = useState(false);
	const padRef = useRef<HTMLDivElement>(null);

	// ポインター位置から音源位置を更新
	const updatePosition = useCallback(
		(clientX: number, clientY: number) => {
			if (!padRef.current) return;

			const rect = padRef.current.getBoundingClientRect();
			const x = clientX - rect.left;
			const y = clientY - rect.top;

			const newPos = pixelToNormalized(x, y, rect.width, rect.height);
			setPosition(newPos);
			onPositionChange?.(newPos.x, newPos.y);
		},
		[onPositionChange],
	);

	// ポインターダウン
	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (disabled) return;

			e.preventDefault();
			setIsDragging(true);
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
			updatePosition(e.clientX, e.clientY);
		},
		[disabled, updatePosition],
	);

	// ポインター移動
	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging || disabled) return;
			updatePosition(e.clientX, e.clientY);
		},
		[isDragging, disabled, updatePosition],
	);

	// ポインターアップ
	const handlePointerUp = useCallback((e: React.PointerEvent) => {
		setIsDragging(false);
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	}, []);

	const markerStyle = normalizedToPercent(position);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Move3d className="h-5 w-5" />
					音源の位置
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* パッド */}
				<div
					ref={padRef}
					className={cn(
						"relative aspect-square w-full cursor-crosshair select-none overflow-hidden rounded-lg border-2 transition-colors",
						disabled
							? "cursor-not-allowed border-muted bg-muted/50"
							: "border-primary/20 bg-gradient-to-b from-primary/5 to-primary/10 hover:border-primary/40",
						isDragging && "border-primary",
					)}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onPointerLeave={handlePointerUp}
				>
					{/* グリッドライン */}
					<div className="pointer-events-none absolute inset-0">
						{/* 十字線 */}
						<div className="-translate-y-1/2 absolute top-1/2 left-0 h-px w-full bg-primary/10" />
						<div className="-translate-x-1/2 absolute top-0 left-1/2 h-full w-px bg-primary/10" />
						{/* 外周円 */}
						<div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-3/4 w-3/4 rounded-full border border-primary/10" />
					</div>

					{/* 方向ラベル */}
					<div className="-translate-x-1/2 pointer-events-none absolute top-2 left-1/2 font-medium text-muted-foreground text-xs">
						前
					</div>
					<div className="-translate-x-1/2 pointer-events-none absolute bottom-2 left-1/2 font-medium text-muted-foreground text-xs">
						後
					</div>
					<div className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 font-medium text-muted-foreground text-xs">
						左
					</div>
					<div className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 font-medium text-muted-foreground text-xs">
						右
					</div>

					{/* リスナー（中央の固定マーカー） */}
					<div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-muted ring-2 ring-muted-foreground/30">
						<span className="text-[10px]">👤</span>
					</div>

					{/* 音源マーカー（ドラッグ可能） */}
					<div
						className={cn(
							"-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform",
							disabled
								? "bg-muted text-muted-foreground"
								: "bg-primary text-primary-foreground",
							isDragging && "scale-110",
						)}
						style={markerStyle}
					>
						<span className="text-sm">🔊</span>
					</div>
				</div>

				{/* 座標表示 */}
				<div className="mt-3 flex justify-center gap-4 text-muted-foreground text-xs">
					<span>
						X: {position.x.toFixed(2)} (
						{position.x < 0 ? "左" : position.x > 0 ? "右" : "中央"})
					</span>
					<span>
						Y: {position.y.toFixed(2)} (
						{position.y > 0 ? "前" : position.y < 0 ? "後" : "中央"})
					</span>
				</div>

				{/* 説明 */}
				<p className="mt-2 text-center text-muted-foreground text-xs">
					パッドをドラッグして音源の位置を調整
				</p>
			</CardContent>
		</Card>
	);
}
