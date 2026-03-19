import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于",
  description: "了解博主和这个博客的技术栈",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
