import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STACKWORLD",
  description: "터미널 기반 협동/경쟁 개발자 RPG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-black text-green-400 font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
