import type { Metadata } from "next";
import { fetchArticle } from "@/lib/api";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let article = null;

  try {
    article = await fetchArticle(slug);
  } catch {
    return {
      title: "文章加载失败",
      description: "文章详情暂时不可用，请稍后重试。",
    };
  }

  if (!article) {
    return { title: "文章不存在" };
  }

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      tags: article.tags,
    },
  };
}

export default function BlogLayout({ children }: Props) {
  return children;
}
