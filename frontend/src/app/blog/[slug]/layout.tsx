import type { Metadata } from "next";
import { fetchArticle } from "@/lib/api";
import { buildSiteUrl, SITE_NAME } from "@/lib/site";

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

  const canonicalPath = `/blog/${article.slug}`;

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      url: buildSiteUrl(canonicalPath),
      siteName: SITE_NAME,
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      tags: article.tags,
      images: article.coverImage
        ? [
            {
              url: article.coverImage,
              alt: article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: article.coverImage ? "summary_large_image" : "summary",
      title: article.title,
      description: article.summary,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default function BlogLayout({ children }: Props) {
  return children;
}
