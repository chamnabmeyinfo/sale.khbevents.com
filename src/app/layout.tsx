import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KHB EVENTS | Cambodia's Premier Event Management & Production",
  description: "Official sales & landing portal for KHB EVENTS. Turnkey staging, 4K LED screens, concert sound, corporate gala dinners and trade expo booth solutions.",
  icons: {
    icon: "/images/khb-logo.png"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#070D0A] text-gray-100">{children}</body>
    </html>
  );
}
