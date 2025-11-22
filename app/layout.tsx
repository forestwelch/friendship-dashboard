import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
