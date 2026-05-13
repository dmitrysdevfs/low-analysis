'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import {
  countNestedNodes,
  getArticleBadge,
  getArticleRouteNumber,
  getArticleTitle,
  getNodeContent,
  getNodeLabel,
  type TreeBranch,
} from '@/lib/lawTree';
import styles from './LawStructureList.module.scss';

export function LawStructureList({ sections, lawId }: { sections: TreeBranch[]; lawId: string }) {
  const sectionsWithArticles = sections.filter(section =>
    section.children.some(node => node.type === 'article')
  );

  return (
    <div className="law-structure-list">
      {sectionsWithArticles.map((section, index) => (
        <SectionBlock key={section.key} section={section} lawId={lawId} index={index} />
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  lawId,
  index,
}: {
  section: TreeBranch;
  lawId: string;
  index: number;
}) {
  const articles = section.children.filter(node => node.type === 'article');

  return (
    <motion.section
      className="panel law-structure-section"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
    >
      <div className="law-structure-section-head">
        <div className={styles.sectionHead}>
          <div className="law-structure-section-kicker mono">
            {section.number ? `Розділ ${section.number}` : 'Структура'}
          </div>
          <h2 className="display law-structure-section-title">
            {section.title ?? 'Без назви розділу'}
          </h2>
        </div>
        <div className="law-structure-section-count mono">
          {articles.length} {articles.length === 1 ? 'стаття' : 'статей'}
        </div>
      </div>

      {articles.length > 0 ? (
        <div className="law-structure-articles">
          {articles.map(article => (
            <ArticleEntry key={article.key} article={article} lawId={lawId} />
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}

function ArticleEntry({ article, lawId }: { article: TreeBranch; lawId: string }) {
  const [open, setOpen] = useState(false);
  const nestedCount = countNestedNodes(article);
  const routeNumber = getArticleRouteNumber(article);

  return (
    <article className="law-structure-article">
      <div className="law-structure-article-head">
        <div className="law-structure-article-main">
          <div className="law-structure-article-label mono">{getArticleBadge(article)}</div>
          {routeNumber ? (
            <Link
              className="law-structure-article-link display"
              href={ROUTES.article(lawId, routeNumber)}
            >
              {getArticleTitle(article)}
            </Link>
          ) : (
            <div className="law-structure-article-link display">{getArticleTitle(article)}</div>
          )}
        </div>

        {nestedCount > 0 ? (
          <button
            type="button"
            className="law-structure-toggle"
            onClick={() => setOpen(value => !value)}
            aria-expanded={open}
          >
            <span>{open ? 'Сховати структуру' : 'Показати структуру'}</span>
            <span className="mono">{nestedCount} ел.</span>
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="law-structure-branch"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            <NestedNodeList nodes={article.children} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

function NestedNodeList({ nodes }: { nodes: TreeBranch[] }) {
  return (
    <div className="law-structure-nested-list">
      {nodes.map(node => (
        <NestedNode key={node.key} node={node} />
      ))}
    </div>
  );
}

function NestedNode({ node }: { node: TreeBranch }) {
  const content = getNodeContent(node);

  return (
    <div className="law-structure-node">
      <div className="law-structure-node-label">{getNodeLabel(node)}</div>
      {content ? <div className="law-structure-node-text">{content}</div> : null}
      {node.children.length > 0 ? (
        <div className="law-structure-node-children">
          <NestedNodeList nodes={node.children} />
        </div>
      ) : null}
    </div>
  );
}
