import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Colage — Be You.",
  description:
    "The social discovery app for college students. See who's on campus. Connect in real life.",
  alternates: {
    canonical: "https://colageclub.com",
  },
  openGraph: {
    title: "Colage — Be You.",
    description:
      "The social discovery app for college students. See who's on campus.",
    url: "https://colageclub.com",
    siteName: "Colage",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Colage — Be You." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Colage — Be You.",
    description: "The social discovery app for college students. See who's on campus.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className={dmSans.className}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
