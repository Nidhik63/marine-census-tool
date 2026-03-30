import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marine Census Tool - Marine Cargo Insurance Certificate",
  description:
    "Upload client documents, extract shipment data, and export Marine Certificate Format IFFCO Excel files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
