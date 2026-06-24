import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  getArticlesByAudience,
} from "@/content/help/articles";
import { HelpArticleView } from "@/components/help/HelpArticleView";
import { ROUTES } from "@/constants/routes";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getArticlesByAudience("user").map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  return { title: article ? `${article.title} | Довідка` : "Довідка" };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article || article.audience === "admin") notFound();

  return (
    <HelpArticleView
      article={article}
      backHref={ROUTES.help}
      backLabel="Довідка"
      buildRelatedHref={ROUTES.helpArticle}
    />
  );
}
