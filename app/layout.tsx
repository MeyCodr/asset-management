import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Asset Management",
  description: "IT Department Asset Management System",
  icons: {
    icon: "/phniams/phniams-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await headers();
  return (
    <html lang="en-GB" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
