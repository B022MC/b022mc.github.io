import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "归档",
  description: "按时间线浏览所有博客文章",
};

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
