import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const tufuliArabic = localFont({
  src: "../lib/fonts/TufuliArabicDEMO-Regular.otf",
  variable: "--font-tufuli",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  adjustFontFallback: false,
});

import { Amiri, Scheherazade_New, Inter, Cairo } from "next/font/google";

const amiri = Amiri({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-amiri",
});

const scheherazade = Scheherazade_New({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
});

import { Providers } from "./providers";
import AuthModal from "./components/auth/auth-modal";
import ChatModal from "./components/chat/chat-modal";
import ThemeToggle from "./components/ui/theme-toggle";
import WhiteboardButton from "./components/whiteboard/WhiteboardButton";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Al-Quran - القرآن الكريم",
  description:
    "Read and explore the Holy Quran with translations and transliterations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${tufuliArabic.variable} ${tufuliArabic.className} ${geistSans.variable} ${geistMono.variable} ${amiri.variable} ${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <AuthModal />
          <ChatModal />
          <ThemeToggle />
          <WhiteboardButton />
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
