import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EvenlySplit - Split Bills Effortlessly",
  description: "The smartest way to split expenses with friends, roommates, and groups. Track who owes what, settle up instantly, and never lose track of shared costs.",
  keywords: ["expense splitting", "bill splitting", "group expenses", "roommate expenses", "shared costs"],
  authors: [{ name: "EvenlySplit Team" }],
  icons: {
    icon: [
      { url: '/icon.png', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon.png',
  },
  openGraph: {
    title: "EvenlySplit - Split Bills Effortlessly",
    description: "The smartest way to split expenses with friends, roommates, and groups.",
    type: "website",
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'EvenlySplit Logo',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="shortcut icon" href="/icon.png" />
        {/* AI Widget Support */}
        <link rel="stylesheet" href="https://chat.voagents.ai/widget.umd.css" />
        <script
          async
          src="https://chat.voagents.ai/widget.umd.js"
          data-voagent-widget="true"
          data-agent-id="d1279fbe-b162-4417-a7db-3a0dd8f7629f"
          data-theme="dark"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
