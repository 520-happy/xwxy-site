import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XWXY · 个人工具导航",
  description: "XWXY 个人工具导航：手机比价、后院保卫战、音乐教室、影视排行榜、盘搜，常用工具与兴趣，一站直达。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
