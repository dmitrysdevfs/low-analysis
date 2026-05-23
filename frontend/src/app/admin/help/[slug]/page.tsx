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

export async function generateStaticParams() {
  return getArticlesByAudience("admin").map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  return { title: article ? `${article.title} | Адмін Довідка` : "Довідка" };
}

export default async function AdminHelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article || article.audience === "user") notFound();

  return (
    <HelpArticleView
      article={article}
      backHref={ROUTES.adminHelp}
      backLabel="Довідка адміна"
      buildRelatedHref={ROUTES.adminHelpArticle}
    />
  );
}
