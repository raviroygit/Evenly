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
  title: "Evenly - Split Bills Effortlessly",
  description: "The smartest way to split expenses with friends, roommates, and groups. Track who owes what, settle up instantly, and never lose track of shared costs.",
  keywords: ["expense splitting", "bill splitting", "group expenses", "roommate expenses", "shared costs"],
  authors: [{ name: "Evenly Team" }],
  openGraph: {
    title: "Evenly - Split Bills Effortlessly",
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
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
