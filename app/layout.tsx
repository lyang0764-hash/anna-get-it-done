import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anna姐·把事做成",
  description: "从一个想法，到一份可以直接使用的成果。",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
