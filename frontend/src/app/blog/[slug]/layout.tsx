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
  const article = await fetchArticle(slug);

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
