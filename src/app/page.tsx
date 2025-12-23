import { Headphones, Volume2, Waves } from "lucide-react";
import { CustomAsmrPlayer } from "@/components/features/custom-asmr-player/CustomAsmrPlayer";

/**
 * Custom ASMR メインページ
 *
 * Server Componentとして静的コンテンツをレンダリング。
 * インタラクティブな部分はCustomAsmrPlayerに委譲。
 */
export default function Home() {
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

			{/* インタラクティブプレイヤー（Client Component） */}
			<CustomAsmrPlayer />

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
