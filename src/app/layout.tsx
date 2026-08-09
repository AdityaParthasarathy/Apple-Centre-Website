import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Manrope, IBM_Plex_Mono } from "next/font/google";
import { MotionConfigProvider } from "@/components/patterns/motion-config-provider";
import "./globals.css";

// Two-face system, not the Next.js starter default (Geist): a confident
// display face for headings that holds up at the large sizes this site
// uses (hero, h1-h2), paired with a warmer, highly-legible grotesk for
// body copy and UI — plus a mono face reserved for the small uppercase
// section labels, giving them a deliberate "engineered" accent rather
// than just being the body font in caps.
// Named *-src, not the plain --font-heading/--font-sans/--font-mono the
// Tailwind theme tokens use in globals.css — @theme inline maps token to
// source there, and giving both ends the same custom property name would
// make that mapping a circular self-reference (resolves to nothing).
const headingFont = Plus_Jakarta_Sans({
  variable: "--font-heading-src",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const bodyFont = Manrope({
  variable: "--font-body-src",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["500", "600"],
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
      className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
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
