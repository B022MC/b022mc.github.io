import type { MetadataRoute } from "next";
import { fetchArticles } from "@/lib/api";
import type { Article } from "@/lib/api";
import { buildSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articles: Article[] = [];

  try {
    const response = await fetchArticles(1, 500);
    articles = response.items;
  } catch {
    articles = [];
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: buildSiteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: buildSiteUrl("/about"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: buildSiteUrl("/archive"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: buildSiteUrl("/tags"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: buildSiteUrl(`/blog/${article.slug}`),
    lastModified: article.updatedAt || article.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...articleRoutes];
}
