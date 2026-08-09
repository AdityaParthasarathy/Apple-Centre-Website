import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionConfigProvider } from "@/components/patterns/motion-config-provider";
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
  title: "Centre for Apple Technologies | RIT Chennai",
  description: "Innovation hub for Apple ecosystem technologies at Rajalakshmi Institute of Technology",
  openGraph: {
    title: "Centre for Apple Technologies",
    description: "Where creativity meets technology",
    type: "website",
  },
};

// Only fonts/metadata/the single <html> shell live here — the public site's
// chrome (dock, header, footer, Lenis) lives in (site)/layout.tsx, and the
// staff portal has its own minimal chrome in staff/layout.tsx. Route groups
// can't be nested inside each other's layout, so anything both would need
// has to sit here instead.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <MotionConfigProvider>{children}</MotionConfigProvider>
      </body>
    </html>
  );
}
