import type { Metadata } from "next";
// import { GeistSans } from "geist/font/sans";
// import { GeistMono } from "geist/font/mono";
import "./globals.css";

// const geistSans = GeistSans;

// const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Visual Try-On",
  description: "Generate three photorealistic looks from one portrait.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
