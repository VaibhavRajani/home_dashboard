import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Markets Dashboard",
  description:
    "Kiosk-style live stock market dashboard for HUBS, NVDA, GOOGL and SPCX.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

export default function StocksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">{children}</div>
  );
}
