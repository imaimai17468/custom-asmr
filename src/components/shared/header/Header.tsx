import { Headphones } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/shared/mode-toggle/ModeToggle";

export const Header = () => {
	return (
		<header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
			<div className="flex items-center justify-between px-6 py-4">
				<Link
					href="/"
					className="flex items-center gap-2 transition-opacity hover:opacity-80"
				>
					<div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5">
						<Headphones className="h-5 w-5 text-white" />
					</div>
					<span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text font-semibold text-lg text-transparent dark:from-violet-400 dark:to-purple-400">
						Custom ASMR
					</span>
				</Link>
				<div className="flex items-center gap-4">
					<a
						href="https://github.com"
						target="_blank"
						rel="noopener noreferrer"
						className="text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						GitHub
					</a>
					<ModeToggle />
				</div>
			</div>
		</header>
	);
};
