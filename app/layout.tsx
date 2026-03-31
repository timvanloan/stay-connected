import type { Metadata } from "next";
import { Inter, Playfair_Display, Outfit } from "next/font/google";
import { TimezoneCookie } from "@/components/TimezoneCookie";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stay Connected",
  description: "A private app for couples to stay emotionally connected",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} ${inter.variable}`}
    >
      <body className="font-sans antialiased min-h-screen bg-[#FDFBF7] text-[#2d2a26]">
        <TimezoneCookie />
        {children}
      </body>
    </html>
  );
}
