import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto Markets Dashboard",
  description:
    "Kiosk-style live crypto market dashboard for BTC, ETH, ADA and LINK.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

export default function CryptoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">{children}</div>
  );
}
