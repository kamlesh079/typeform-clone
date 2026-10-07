import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Formly - Typeform clone",
  description: "Beautiful forms, made simply.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
