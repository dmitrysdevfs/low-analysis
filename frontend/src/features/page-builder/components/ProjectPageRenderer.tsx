"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type {
  CardsBlock,
  CtaBlock,
  FaqBlock,
  HeroBlock,
  ImageBlock,
  ManagedPagePublicResponse,
  PageBuilderBlock,
  PageBuilderSnapshot,
  QuoteBlock,
  RadioGroupBlock,
  RichTextBlock,
  StatsGridBlock,
  StepsBlock,
} from "@/types";
import styles from "../PageBuilder.module.scss";

type RenderablePage = Pick<
  ManagedPagePublicResponse,
  "title" | "description" | "blocks"
> &
  Partial<ManagedPagePublicResponse>;

function renderParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function ActionLink({
  href,
  label,
  secondary = false,
}: {
  href: string;
  label: string;
  secondary?: boolean;
}) {
  if (!label || !href) return null;
  const className = secondary ? styles.actionSecondary : styles.actionPrimary;

  if (href.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function RadioGroupBlockView({ block }: { block: RadioGroupBlock }) {
  const [selected, setSelected] = useState(block.data.options[0]?.value ?? "");

  return (
    <div className={styles.radioShell}>
      <div className={styles.blockHeadingRow}>
        <span className={styles.blockTypePill}>Radio group</span>
        <h3 className={styles.blockTitle}>{block.data.title}</h3>
      </div>
      <p className={styles.blockDescription}>{block.data.question}</p>
      <div className={styles.radioOptions}>
        {block.data.options.map((option) => (
          <label key={option.value} className={styles.radioOption}>
            <input
              type="radio"
              name={block.id}
              value={option.value}
              checked={selected === option.value}
              onChange={() => setSelected(option.value)}
            />
            <span className={styles.radioVisual} />
            <span className={styles.radioCopy}>
              <strong>{option.label}</strong>
              {option.description && <small>{option.description}</small>}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function renderBlock(block: PageBuilderBlock) {
  switch (block.type) {
    case "hero": {
      const hero = block as HeroBlock;
      return (
        <div
          className={`${styles.heroBlock} ${styles[`theme_${hero.style.theme}`] ?? ""}`}
        >
          <div className={styles.heroCopy}>
            {hero.data.eyebrow && (
              <span className={styles.heroEyebrow}>{hero.data.eyebrow}</span>
            )}
            <h2 className={styles.heroTitle}>{hero.data.title}</h2>
            {hero.data.subtitle && (
              <p className={styles.heroSubtitle}>{hero.data.subtitle}</p>
            )}
            <div className={styles.actionRow}>
              <ActionLink
                href={hero.data.primaryButtonHref}
                label={hero.data.primaryButtonLabel}
              />
              <ActionLink
                href={hero.data.secondaryButtonHref}
                label={hero.data.secondaryButtonLabel}
                secondary
              />
            </div>
          </div>
        </div>
      );
    }

    case "richText": {
      const text = block as RichTextBlock;
      return (
        <div className={styles.textBlock}>
          {text.data.title && (
            <h3 className={styles.blockTitle}>{text.data.title}</h3>
          )}
          <div className={styles.prose}>
            {renderParagraphs(text.data.body).map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      );
    }

    case "statsGrid": {
      const stats = block as StatsGridBlock;
      return (
        <div className={styles.panelBlock}>
          {stats.data.title && (
            <h3 className={styles.blockTitle}>{stats.data.title}</h3>
          )}
          <div className={styles.statsGrid}>
            {stats.data.items.map((item, index) => (
              <article
                key={`${item.label}-${index}`}
                className={styles.statCard}
              >
                <span className={styles.statValue}>{item.value}</span>
                <strong className={styles.statLabel}>{item.label}</strong>
                {item.caption && (
                  <p className={styles.statCaption}>{item.caption}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      );
    }

    case "cards": {
      const cards = block as CardsBlock;
      return (
        <div className={styles.panelBlock}>
          {cards.data.title && (
            <h3 className={styles.blockTitle}>{cards.data.title}</h3>
          )}
          <div className={styles.cardsGrid}>
            {cards.data.items.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className={styles.infoCard}
              >
                {item.badge && (
                  <span className={styles.cardBadge}>{item.badge}</span>
                )}
                <h4>{item.title}</h4>
                <p>{item.body}</p>
                <ActionLink
                  href={item.linkHref}
                  label={item.linkLabel}
                  secondary
                />
              </article>
            ))}
          </div>
        </div>
      );
    }

    case "steps": {
      const steps = block as StepsBlock;
      return (
        <div className={styles.panelBlock}>
          {steps.data.title && (
            <h3 className={styles.blockTitle}>{steps.data.title}</h3>
          )}
          <div className={styles.stepsList}>
            {steps.data.items.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className={styles.stepCard}
              >
                <span className={styles.stepIndex}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    case "faq": {
      const faq = block as FaqBlock;
      return (
        <div className={styles.panelBlock}>
          {faq.data.title && (
            <h3 className={styles.blockTitle}>{faq.data.title}</h3>
          )}
          <div className={styles.faqList}>
            {faq.data.items.map((item, index) => (
              <details
                key={`${item.question}-${index}`}
                className={styles.faqItem}
              >
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      );
    }

    case "cta": {
      const cta = block as CtaBlock;
      return (
        <div className={styles.ctaBlock}>
          <div className={styles.ctaCopy}>
            <h3 className={styles.blockTitle}>{cta.data.title}</h3>
            <p className={styles.blockDescription}>{cta.data.body}</p>
          </div>
          <div className={styles.actionRow}>
            <ActionLink
              href={cta.data.buttonHref}
              label={cta.data.buttonLabel}
            />
            <ActionLink
              href={cta.data.secondaryButtonHref}
              label={cta.data.secondaryButtonLabel}
              secondary
            />
          </div>
        </div>
      );
    }

    case "radioGroup":
      return <RadioGroupBlockView block={block as RadioGroupBlock} />;

    case "quote": {
      const quote = block as QuoteBlock;
      return (
        <blockquote className={styles.quoteBlock}>
          <p>“{quote.data.quote}”</p>
          <footer>
            <strong>{quote.data.author}</strong>
            {quote.data.role && <span>{quote.data.role}</span>}
          </footer>
        </blockquote>
      );
    }

    case "image": {
      const image = block as ImageBlock;
      return (
        <div className={styles.imageBlock}>
          {image.data.title && (
            <h3 className={styles.blockTitle}>{image.data.title}</h3>
          )}
          {image.data.src && (
            <img
              src={image.data.src}
              alt={image.data.alt || image.data.title}
              className={styles.image}
            />
          )}
          {image.data.caption && (
            <p className={styles.imageCaption}>{image.data.caption}</p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

export function ProjectPageRenderer({
  page,
  embedded = false,
}: {
  page: RenderablePage | PageBuilderSnapshot;
  embedded?: boolean;
}) {
  const visibleBlocks = useMemo(
    () =>
      page.blocks.filter((block) =>
        embedded ? block.enabled : block.enabled && !block.style.hideOnMobile,
      ),
    [page.blocks],
  );

  return (
    <div
      className={`${styles.publicPage} ${embedded ? styles.publicPageEmbedded : ""}`}
    >
      {!embedded && (
        <header className={styles.publicPageHeader}>
          <span className={styles.publicPageEyebrow}>
            Інформація про платформу
          </span>
          <h1>{page.title}</h1>
          {page.description && <p>{page.description}</p>}
        </header>
      )}

      <div className={styles.publicBlocks}>
        {visibleBlocks.map((block, index) => (
          <motion.section
            key={block.id}
            className={`${styles.publicBlock} ${styles[`spaceTop_${block.style.spacingTop}`] ?? ""} ${styles[`spaceBottom_${block.style.spacingBottom}`] ?? ""}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: embedded ? 0 : index * 0.04, duration: 0.28 }}
          >
            {renderBlock(block)}
          </motion.section>
        ))}
      </div>
    </div>
  );
}
