"use client";

import type {
  CardsBlock,
  CtaBlock,
  FaqBlock,
  HeroBlock,
  ImageBlock,
  PageBuilderBlock,
  QuoteBlock,
  RadioGroupBlock,
  RichTextBlock,
  StatsGridBlock,
  StepsBlock,
} from "@/types";
import {
  createCardItem,
  createFaqItem,
  createRadioOption,
  createStatsItem,
  createStepItem,
  updateListItem,
} from "../lib/pageBuilderBlocks";
import styles from "../PageBuilder.module.scss";

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.toggleField}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function BlockSettingsPanel({
  block,
  onChange,
  onDuplicate,
  onRemove,
}: {
  block: PageBuilderBlock;
  onChange: (block: PageBuilderBlock) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const updateBlock = (nextBlock: PageBuilderBlock) => onChange(nextBlock);

  const updateStyle = (patch: Partial<PageBuilderBlock["style"]>) => {
    updateBlock({
      ...block,
      style: {
        ...block.style,
        ...patch,
      },
    });
  };

  const renderTypeFields = () => {
    switch (block.type) {
      case "hero": {
        const hero = block as HeroBlock;
        return (
          <>
            <TextField
              label="Eyebrow"
              value={hero.data.eyebrow}
              onChange={(eyebrow) =>
                updateBlock({
                  ...hero,
                  data: { ...hero.data, eyebrow },
                })
              }
            />
            <TextField
              label="Заголовок"
              value={hero.data.title}
              onChange={(title) =>
                updateBlock({
                  ...hero,
                  data: { ...hero.data, title },
                })
              }
            />
            <TextareaField
              label="Підзаголовок"
              value={hero.data.subtitle}
              onChange={(subtitle) =>
                updateBlock({
                  ...hero,
                  data: { ...hero.data, subtitle },
                })
              }
            />
            <TextField
              label="Primary button label"
              value={hero.data.primaryButtonLabel}
              onChange={(primaryButtonLabel) =>
                updateBlock({
                  ...hero,
                  data: { ...hero.data, primaryButtonLabel },
                })
              }
            />
            <TextField
              label="Primary button href"
              value={hero.data.primaryButtonHref}
              onChange={(primaryButtonHref) =>
                updateBlock({
                  ...hero,
                  data: { ...hero.data, primaryButtonHref },
                })
              }
            />
            <TextField
              label="Secondary button label"
              value={hero.data.secondaryButtonLabel}
              onChange={(secondaryButtonLabel) =>
                updateBlock({
                  ...hero,
                  data: { ...hero.data, secondaryButtonLabel },
                })
              }
            />
            <TextField
              label="Secondary button href"
              value={hero.data.secondaryButtonHref}
              onChange={(secondaryButtonHref) =>
                updateBlock({
                  ...hero,
                  data: { ...hero.data, secondaryButtonHref },
                })
              }
            />
          </>
        );
      }

      case "richText": {
        const richText = block as RichTextBlock;
        return (
          <>
            <TextField
              label="Заголовок"
              value={richText.data.title}
              onChange={(title) =>
                updateBlock({
                  ...richText,
                  data: { ...richText.data, title },
                })
              }
            />
            <TextareaField
              label="Текст"
              rows={8}
              value={richText.data.body}
              onChange={(body) =>
                updateBlock({
                  ...richText,
                  data: { ...richText.data, body },
                })
              }
            />
          </>
        );
      }

      case "statsGrid": {
        const stats = block as StatsGridBlock;
        return (
          <>
            <TextField
              label="Заголовок"
              value={stats.data.title}
              onChange={(title) =>
                updateBlock({ ...stats, data: { ...stats.data, title } })
              }
            />
            {stats.data.items.map((item, index) => (
              <div key={`${item.label}-${index}`} className={styles.listEditorCard}>
                <div className={styles.listEditorHeader}>
                  <strong>Картка #{index + 1}</strong>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() =>
                      updateBlock({
                        ...stats,
                        data: {
                          ...stats.data,
                          items: stats.data.items.filter((_, i) => i !== index),
                        },
                      })
                    }
                  >
                    Видалити
                  </button>
                </div>
                <TextField
                  label="Label"
                  value={item.label}
                  onChange={(label) =>
                    updateBlock({
                      ...stats,
                      data: {
                        ...stats.data,
                        items: updateListItem(stats.data.items, index, (current) => ({
                          ...current,
                          label,
                        })),
                      },
                    })
                  }
                />
                <TextField
                  label="Value"
                  value={item.value}
                  onChange={(value) =>
                    updateBlock({
                      ...stats,
                      data: {
                        ...stats.data,
                        items: updateListItem(stats.data.items, index, (current) => ({
                          ...current,
                          value,
                        })),
                      },
                    })
                  }
                />
                <TextareaField
                  label="Caption"
                  value={item.caption}
                  onChange={(caption) =>
                    updateBlock({
                      ...stats,
                      data: {
                        ...stats.data,
                        items: updateListItem(stats.data.items, index, (current) => ({
                          ...current,
                          caption,
                        })),
                      },
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                updateBlock({
                  ...stats,
                  data: { ...stats.data, items: [...stats.data.items, createStatsItem()] },
                })
              }
            >
              Додати показник
            </button>
          </>
        );
      }

      case "cards": {
        const cards = block as CardsBlock;
        return (
          <>
            <TextField
              label="Заголовок"
              value={cards.data.title}
              onChange={(title) =>
                updateBlock({ ...cards, data: { ...cards.data, title } })
              }
            />
            {cards.data.items.map((item, index) => (
              <div key={`${item.title}-${index}`} className={styles.listEditorCard}>
                <div className={styles.listEditorHeader}>
                  <strong>Картка #{index + 1}</strong>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() =>
                      updateBlock({
                        ...cards,
                        data: {
                          ...cards.data,
                          items: cards.data.items.filter((_, i) => i !== index),
                        },
                      })
                    }
                  >
                    Видалити
                  </button>
                </div>
                <TextField
                  label="Badge"
                  value={item.badge}
                  onChange={(badge) =>
                    updateBlock({
                      ...cards,
                      data: {
                        ...cards.data,
                        items: updateListItem(cards.data.items, index, (current) => ({
                          ...current,
                          badge,
                        })),
                      },
                    })
                  }
                />
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(title) =>
                    updateBlock({
                      ...cards,
                      data: {
                        ...cards.data,
                        items: updateListItem(cards.data.items, index, (current) => ({
                          ...current,
                          title,
                        })),
                      },
                    })
                  }
                />
                <TextareaField
                  label="Body"
                  value={item.body}
                  onChange={(body) =>
                    updateBlock({
                      ...cards,
                      data: {
                        ...cards.data,
                        items: updateListItem(cards.data.items, index, (current) => ({
                          ...current,
                          body,
                        })),
                      },
                    })
                  }
                />
                <TextField
                  label="Link label"
                  value={item.linkLabel}
                  onChange={(linkLabel) =>
                    updateBlock({
                      ...cards,
                      data: {
                        ...cards.data,
                        items: updateListItem(cards.data.items, index, (current) => ({
                          ...current,
                          linkLabel,
                        })),
                      },
                    })
                  }
                />
                <TextField
                  label="Link href"
                  value={item.linkHref}
                  onChange={(linkHref) =>
                    updateBlock({
                      ...cards,
                      data: {
                        ...cards.data,
                        items: updateListItem(cards.data.items, index, (current) => ({
                          ...current,
                          linkHref,
                        })),
                      },
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                updateBlock({
                  ...cards,
                  data: { ...cards.data, items: [...cards.data.items, createCardItem()] },
                })
              }
            >
              Додати картку
            </button>
          </>
        );
      }

      case "steps": {
        const steps = block as StepsBlock;
        return (
          <>
            <TextField
              label="Заголовок"
              value={steps.data.title}
              onChange={(title) =>
                updateBlock({ ...steps, data: { ...steps.data, title } })
              }
            />
            {steps.data.items.map((item, index) => (
              <div key={`${item.title}-${index}`} className={styles.listEditorCard}>
                <div className={styles.listEditorHeader}>
                  <strong>Крок #{index + 1}</strong>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() =>
                      updateBlock({
                        ...steps,
                        data: {
                          ...steps.data,
                          items: steps.data.items.filter((_, i) => i !== index),
                        },
                      })
                    }
                  >
                    Видалити
                  </button>
                </div>
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(title) =>
                    updateBlock({
                      ...steps,
                      data: {
                        ...steps.data,
                        items: updateListItem(steps.data.items, index, (current) => ({
                          ...current,
                          title,
                        })),
                      },
                    })
                  }
                />
                <TextareaField
                  label="Body"
                  value={item.body}
                  onChange={(body) =>
                    updateBlock({
                      ...steps,
                      data: {
                        ...steps.data,
                        items: updateListItem(steps.data.items, index, (current) => ({
                          ...current,
                          body,
                        })),
                      },
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                updateBlock({
                  ...steps,
                  data: { ...steps.data, items: [...steps.data.items, createStepItem()] },
                })
              }
            >
              Додати крок
            </button>
          </>
        );
      }

      case "faq": {
        const faq = block as FaqBlock;
        return (
          <>
            <TextField
              label="Заголовок"
              value={faq.data.title}
              onChange={(title) =>
                updateBlock({ ...faq, data: { ...faq.data, title } })
              }
            />
            {faq.data.items.map((item, index) => (
              <div key={`${item.question}-${index}`} className={styles.listEditorCard}>
                <div className={styles.listEditorHeader}>
                  <strong>FAQ #{index + 1}</strong>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() =>
                      updateBlock({
                        ...faq,
                        data: {
                          ...faq.data,
                          items: faq.data.items.filter((_, i) => i !== index),
                        },
                      })
                    }
                  >
                    Видалити
                  </button>
                </div>
                <TextField
                  label="Question"
                  value={item.question}
                  onChange={(question) =>
                    updateBlock({
                      ...faq,
                      data: {
                        ...faq.data,
                        items: updateListItem(faq.data.items, index, (current) => ({
                          ...current,
                          question,
                        })),
                      },
                    })
                  }
                />
                <TextareaField
                  label="Answer"
                  value={item.answer}
                  onChange={(answer) =>
                    updateBlock({
                      ...faq,
                      data: {
                        ...faq.data,
                        items: updateListItem(faq.data.items, index, (current) => ({
                          ...current,
                          answer,
                        })),
                      },
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                updateBlock({
                  ...faq,
                  data: { ...faq.data, items: [...faq.data.items, createFaqItem()] },
                })
              }
            >
              Додати питання
            </button>
          </>
        );
      }

      case "cta": {
        const cta = block as CtaBlock;
        return (
          <>
            <TextField
              label="Заголовок"
              value={cta.data.title}
              onChange={(title) =>
                updateBlock({ ...cta, data: { ...cta.data, title } })
              }
            />
            <TextareaField
              label="Опис"
              value={cta.data.body}
              onChange={(body) =>
                updateBlock({ ...cta, data: { ...cta.data, body } })
              }
            />
            <TextField
              label="Button label"
              value={cta.data.buttonLabel}
              onChange={(buttonLabel) =>
                updateBlock({ ...cta, data: { ...cta.data, buttonLabel } })
              }
            />
            <TextField
              label="Button href"
              value={cta.data.buttonHref}
              onChange={(buttonHref) =>
                updateBlock({ ...cta, data: { ...cta.data, buttonHref } })
              }
            />
            <TextField
              label="Secondary button label"
              value={cta.data.secondaryButtonLabel}
              onChange={(secondaryButtonLabel) =>
                updateBlock({
                  ...cta,
                  data: { ...cta.data, secondaryButtonLabel },
                })
              }
            />
            <TextField
              label="Secondary button href"
              value={cta.data.secondaryButtonHref}
              onChange={(secondaryButtonHref) =>
                updateBlock({
                  ...cta,
                  data: { ...cta.data, secondaryButtonHref },
                })
              }
            />
          </>
        );
      }

      case "radioGroup": {
        const radioGroup = block as RadioGroupBlock;
        return (
          <>
            <TextField
              label="Заголовок"
              value={radioGroup.data.title}
              onChange={(title) =>
                updateBlock({
                  ...radioGroup,
                  data: { ...radioGroup.data, title },
                })
              }
            />
            <TextareaField
              label="Питання"
              value={radioGroup.data.question}
              onChange={(question) =>
                updateBlock({
                  ...radioGroup,
                  data: { ...radioGroup.data, question },
                })
              }
            />
            {radioGroup.data.options.map((item, index) => (
              <div key={`${item.value}-${index}`} className={styles.listEditorCard}>
                <div className={styles.listEditorHeader}>
                  <strong>Опція #{index + 1}</strong>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() =>
                      updateBlock({
                        ...radioGroup,
                        data: {
                          ...radioGroup.data,
                          options: radioGroup.data.options.filter((_, i) => i !== index),
                        },
                      })
                    }
                  >
                    Видалити
                  </button>
                </div>
                <TextField
                  label="Label"
                  value={item.label}
                  onChange={(label) =>
                    updateBlock({
                      ...radioGroup,
                      data: {
                        ...radioGroup.data,
                        options: updateListItem(
                          radioGroup.data.options,
                          index,
                          (current) => ({ ...current, label }),
                        ),
                      },
                    })
                  }
                />
                <TextField
                  label="Value"
                  value={item.value}
                  onChange={(value) =>
                    updateBlock({
                      ...radioGroup,
                      data: {
                        ...radioGroup.data,
                        options: updateListItem(
                          radioGroup.data.options,
                          index,
                          (current) => ({ ...current, value }),
                        ),
                      },
                    })
                  }
                />
                <TextareaField
                  label="Description"
                  value={item.description}
                  onChange={(description) =>
                    updateBlock({
                      ...radioGroup,
                      data: {
                        ...radioGroup.data,
                        options: updateListItem(
                          radioGroup.data.options,
                          index,
                          (current) => ({ ...current, description }),
                        ),
                      },
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                updateBlock({
                  ...radioGroup,
                  data: {
                    ...radioGroup.data,
                    options: [...radioGroup.data.options, createRadioOption()],
                  },
                })
              }
            >
              Додати опцію
            </button>
          </>
        );
      }

      case "quote": {
        const quote = block as QuoteBlock;
        return (
          <>
            <TextareaField
              label="Цитата"
              value={quote.data.quote}
              onChange={(quoteText) =>
                updateBlock({
                  ...quote,
                  data: { ...quote.data, quote: quoteText },
                })
              }
            />
            <TextField
              label="Автор"
              value={quote.data.author}
              onChange={(author) =>
                updateBlock({
                  ...quote,
                  data: { ...quote.data, author },
                })
              }
            />
            <TextField
              label="Роль / підпис"
              value={quote.data.role}
              onChange={(role) =>
                updateBlock({
                  ...quote,
                  data: { ...quote.data, role },
                })
              }
            />
          </>
        );
      }

      case "image": {
        const image = block as ImageBlock;
        return (
          <>
            <TextField
              label="Заголовок"
              value={image.data.title}
              onChange={(title) =>
                updateBlock({ ...image, data: { ...image.data, title } })
              }
            />
            <TextField
              label="Image URL"
              value={image.data.src}
              onChange={(src) =>
                updateBlock({ ...image, data: { ...image.data, src } })
              }
            />
            <TextField
              label="Alt"
              value={image.data.alt}
              onChange={(alt) =>
                updateBlock({ ...image, data: { ...image.data, alt } })
              }
            />
            <TextareaField
              label="Caption"
              value={image.data.caption}
              onChange={(caption) =>
                updateBlock({ ...image, data: { ...image.data, caption } })
              }
            />
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={styles.inspectorPanel}>
      <div className={styles.inspectorHeader}>
        <div>
          <span className={styles.inspectorEyebrow}>Налаштування блока</span>
          <h3>{block.type}</h3>
        </div>
        <div className={styles.inspectorActions}>
          <button type="button" className={styles.ghostButton} onClick={onDuplicate}>
            Дублювати
          </button>
          <button type="button" className={styles.ghostButtonDanger} onClick={onRemove}>
            Видалити
          </button>
        </div>
      </div>

      <BooleanField
        label="Блок увімкнений"
        checked={block.enabled}
        onChange={(enabled) => updateBlock({ ...block, enabled })}
      />

      <SelectField
        label="Варіант"
        value={block.variant}
        options={[
          { label: "Default", value: "default" },
          { label: "Split", value: "split" },
          { label: "Stacked", value: "stacked" },
          { label: "Timeline", value: "timeline" },
          { label: "Banner", value: "banner" },
          { label: "Wide", value: "wide" },
          { label: "Four-up", value: "four-up" },
          { label: "Three-up", value: "three-up" },
          { label: "Highlight", value: "highlight" },
        ]}
        onChange={(variant) => updateBlock({ ...block, variant })}
      />

      <div className={styles.sectionSeparator} />

      {renderTypeFields()}

      <div className={styles.sectionSeparator} />

      <SelectField
        label="Theme"
        value={block.style.theme}
        options={[
          { label: "Default", value: "default" },
          { label: "Navy / Gold", value: "navy-gold" },
          { label: "Glass", value: "glass" },
          { label: "Surface", value: "surface" },
          { label: "Muted", value: "muted" },
          { label: "Gold", value: "gold" },
        ]}
        onChange={(theme) => updateStyle({ theme })}
      />

      <div className={styles.fieldRow}>
        <SelectField
          label="Top spacing"
          value={block.style.spacingTop}
          options={[
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Extra", value: "xl" },
          ]}
          onChange={(spacingTop) => updateStyle({ spacingTop })}
        />
        <SelectField
          label="Bottom spacing"
          value={block.style.spacingBottom}
          options={[
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Extra", value: "xl" },
          ]}
          onChange={(spacingBottom) => updateStyle({ spacingBottom })}
        />
      </div>

      <TextField
        label="Background token"
        value={block.style.background}
        onChange={(background) => updateStyle({ background })}
      />
      <TextField
        label="Accent token"
        value={block.style.accent}
        onChange={(accent) => updateStyle({ accent })}
      />

      <BooleanField
        label="Приховати на мобільному"
        checked={block.style.hideOnMobile}
        onChange={(hideOnMobile) => updateStyle({ hideOnMobile })}
      />
    </div>
  );
}
