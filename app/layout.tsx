import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { QueryProvider } from "@/lib/providers";
import { WebVitals } from "@/components/WebVitals";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start-2p",
});

export const metadata: Metadata = {
  title: "Friendship Dashboard",
  description: "A personalized social dashboard for your friends",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pressStart2P.variable}>
      <body>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <WebVitals />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
