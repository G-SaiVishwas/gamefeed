import type { Metadata, Viewport } from "next";
import { Fredoka, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displayFont = Fredoka({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://brotgames.vercel.app"),
  title: "GameFeed",
  description: "Scroll games instead of videos",
  openGraph: {
    title: "GameFeed",
    description: "Scroll games instead of videos",
    url: "https://brotgames.vercel.app",
    siteName: "GameFeed",
    images: [
      {
        url: "/og-image.jpg",
        width: 1024,
        height: 1016,
        alt: "GameFeed",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameFeed",
    description: "Scroll games instead of videos",
    images: ["/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fdf6e3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} h-full`}
    >
      <body className="h-full overflow-hidden bg-[#fdf6e3] text-[#2b2b3a] antialiased">
        {children}
      </body>
    </html>
  );
}
