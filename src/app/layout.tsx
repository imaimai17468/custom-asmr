import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/shared/header/Header";
import { ThemeProvider } from "@/components/shared/theme-provider/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Custom ASMR - YouTube 3D空間音響プレイヤー",
  description:
    "YouTubeの動画を3D音響に変換。音源の位置を自由にコントロールして、没入感のある体験を。",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Custom ASMR - YouTube 3D空間音響プレイヤー",
    description:
      "YouTubeの動画を3D音響に変換。音源の位置を自由にコントロールして、没入感のある体験を。",
    images: [
      {
        url: "/ogp.png",
        width: 1200,
        height: 630,
        alt: "Custom ASMR",
      },
    ],
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom ASMR - YouTube 3D空間音響プレイヤー",
    description:
      "YouTubeの動画を3D音響に変換。音源の位置を自由にコントロールして、没入感のある体験を。",
    images: ["/ogp.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className="antialiased"
        style={{
          fontFamily:
            '"Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN W3", "Hiragino Kaku Gothic Pro", "ヒラギノ角ゴ Pro W3", "メイリオ", Meiryo, "游ゴシック", YuGothic, sans-serif',
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-dvh flex-col gap-16">
            <Header />
            <div className="flex w-full flex-1 justify-center px-6 md:px-4">
              <div className="container w-full">{children}</div>
            </div>
          </div>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
