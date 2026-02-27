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

const SITE_URL = 'https://evenlysplit.nxtgenaidev.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'EvenlySplit - Split Bills Effortlessly',
    template: '%s | EvenlySplit',
  },
  description: 'The smartest way to split expenses with friends, roommates, and groups. Track who owes what, settle up instantly, and never lose track of shared costs.',
  keywords: ['expense splitting', 'bill splitting', 'group expenses', 'split bills', 'roommate expenses', 'shared costs', 'money tracker', 'expense tracker', 'split payment', 'evenlysplit'],
  authors: [{ name: 'EvenlySplit Team', url: SITE_URL }],
  creator: 'NxtGenAiDev',
  publisher: 'NxtGenAiDev',
  applicationName: 'EvenlySplit',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
    title: 'EvenlySplit - Split Bills Effortlessly',
    description: 'The smartest way to split expenses with friends, roommates, and groups. Track who owes what, settle up instantly.',
    url: SITE_URL,
    siteName: 'EvenlySplit',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 512,
        height: 512,
        alt: 'EvenlySplit - Split Bills Effortlessly',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'EvenlySplit - Split Bills Effortlessly',
    description: 'The smartest way to split expenses with friends, roommates, and groups.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: 'finance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
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
