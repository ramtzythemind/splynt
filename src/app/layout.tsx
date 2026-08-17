import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Splynt — la tua carriera da pilota di linea su MSFS",
    template: "%s · Splynt",
  },
  description:
    "Scegli una compagnia aerea, vola i suoi orari reali su Microsoft Flight Simulator 2020 e 2024, e costruisci una carriera da cadetto a comandante.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink-950">{children}</body>
    </html>
  );
}
