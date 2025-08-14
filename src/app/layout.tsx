import type { Metadata } from "next";
import { Inter, Kumbh_Sans, Lato } from "next/font/google";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { Providers } from "@/components/Providers";
import { DebugSupabase } from "@/components/DebugSupabase";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"]
});

const kumbhSans = Kumbh_Sans({ 
  subsets: ["latin"],
  variable: "--font-kumbh",
  weight: ["400", "500", "600", "700"]
});

const lato = Lato({ 
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["400", "700"]
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://b2b-design-stash.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "B2B Design Stash - Real B2B Design Inspiration",
    template: "%s | B2B Design Stash"
  },
  description: "Skip the hype. Skip the lifeless templates. See the work real marketers and designers use to win deals and grow brands. Curated by Design Buffs.",
  keywords: ["B2B design", "design inspiration", "marketing design", "SaaS design", "corporate design", "B2B templates", "design gallery", "marketing materials"],
  authors: [{ name: "Design Buffs", url: "https://designbuffs.com" }],
  creator: "Design Buffs",
  publisher: "Design Buffs",
  category: "Design",
  classification: "Business Design Gallery",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "B2B Design Stash - Real B2B Design Inspiration",
    description: "Skip the hype. Skip the lifeless templates. See the work real marketers and designers use to win deals and grow brands.",
    url: siteUrl,
    siteName: "B2B Design Stash",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/design-buffs-logo.png",
        width: 1200,
        height: 630,
        alt: "B2B Design Stash - Real B2B Design Inspiration Gallery"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "B2B Design Stash - Real B2B Design Inspiration",
    description: "Skip the hype. Skip the lifeless templates. See the work real marketers and designers use to win deals and grow brands.",
    creator: "@designbuffs",
    images: ["/design-buffs-logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.prod.website-files.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://nocodb.designbuffs.com" />
        <link rel="dns-prefetch" href="https://designbuffs.com" />
        <link rel="icon" href="/design-buffs-icon.jpeg" sizes="any" />
        <link rel="apple-touch-icon" href="/design-buffs-icon.jpeg" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.variable} ${kumbhSans.variable} ${lato.variable} antialiased`} suppressHydrationWarning={true}>
        <Providers>
          <DebugSupabase />
          <PerformanceMonitor />
          {children}
        </Providers>
      </body>
    </html>
  );
}
