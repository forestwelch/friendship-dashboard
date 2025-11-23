import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { YouTubePlayerProvider } from "@/components/YouTubePlayer";

export const metadata: Metadata = {
  title: "Friendship Dashboard",
  description: "A personalized social dashboard for your friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Load YouTube API using Next.js Script component - safer than manual DOM manipulation */}
        <Script
          src="https://www.youtube.com/iframe_api"
          strategy="lazyOnload"
          id="youtube-api-script"
        />
        <YouTubePlayerProvider>{children}</YouTubePlayerProvider>
      </body>
    </html>
  );
}
