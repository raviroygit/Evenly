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
  openGraph: {
    title: "EvenlySplit - Split Bills Effortlessly",
    description: "The smartest way to split expenses with friends, roommates, and groups.",
    type: "website",
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
        {/* AI Widget Support */}
        <link rel="stylesheet" href="https://chat.voagents.ai/widget.umd.css" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <Navigation />
        {children}
        
        {/* AI Widget Script */}
        <script
          src="https://chat.voagents.ai/widget.umd.js"
          data-voagent-widget="true"
          data-agent-id="d1279fbe-b162-4417-a7db-3a0dd8f7629f"
          data-theme="dark"
        />
      </body>
    </html>
  );
}
