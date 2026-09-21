import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brookline Dashboard",
  description: "Brookline Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
