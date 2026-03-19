import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录 / 注册",
  description: "登录或注册以发表评论和管理文章",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
