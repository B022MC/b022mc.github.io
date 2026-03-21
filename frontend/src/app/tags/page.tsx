import type { Metadata } from "next";
import { Suspense } from "react";
import { TagsContent } from "./tags-client";
import { buildSiteUrl } from "@/lib/site";

interface TagsPageProps {
  searchParams: Promise<{ tag?: string; q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: TagsPageProps): Promise<Metadata> {
  const { tag = "", q = "" } = await searchParams;
  const selectedTag = tag.trim();
  const query = q.trim();
  const params = new URLSearchParams();

  if (selectedTag) {
    params.set("tag", selectedTag);
  }
  if (query) {
    params.set("q", query);
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const canonicalPath = `/tags${suffix}`;
  const title = selectedTag
    ? `标签：${selectedTag}`
    : query
      ? `搜索：${query}`
      : "标签";
  const description = selectedTag
    ? `浏览标签“${selectedTag}”下的全部文章。`
    : query
      ? `搜索与“${query}”相关的博客文章。`
      : "按标签和关键词浏览博客文章。";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: buildSiteUrl(canonicalPath),
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function TagsPage() {
  return (
    <Suspense fallback={null}>
      <TagsContent />
    </Suspense>
  );
}
