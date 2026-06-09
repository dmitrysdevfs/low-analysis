"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApi, type EmailAudience } from "@/lib/api/admin";
import styles from "./page.module.scss";

const TEMPLATE_OPTIONS = [
  { value: "broadcast", label: "Широкомовлення" },
  { value: "maintenance", label: "Технічне обслуговування" },
  { value: "product-update", label: "Оновлення продукту" },
];

const AUDIENCE_TYPES = [
  { value: "all", label: "Всі активні користувачі" },
  { value: "role", label: "За роллю" },
  { value: "billing", label: "За тарифом" },
  { value: "custom", label: "Вручну (email-адреси)" },
];

const ROLES = ["user", "admin", "legislator", "paid_user"];
const BILLING_PLANS = ["preview", "trial", "user", "plus", "pro"];

export default function AdminEmailComposePage() {
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [templateSlug, setTemplateSlug] = useState("broadcast");
  const [theme, setTheme] = useState("default");
  const [props, setProps] = useState({
    headline: "",
    body: "",
    ctaText: "",
    ctaUrl: "",
  });
  const [audience, setAudience] = useState<EmailAudience>({ type: "all" });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedBilling, setSelectedBilling] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sent, setSent] = useState<{ sent: number; total: number } | null>(
    null,
  );

  const themesQuery = useQuery({
    queryKey: ["email-themes"],
    queryFn: () => adminApi.getEmailThemes(),
  });

  function buildAudience(): EmailAudience {
    if (audience.type === "role") return { type: "role", roles: selectedRoles };
    if (audience.type === "billing")
      return { type: "billing", billingPlans: selectedBilling };
    if (audience.type === "custom")
      return {
        type: "custom",
        customEmails: customEmails
          .split("\n")
          .map((e) => e.trim())
          .filter(Boolean),
      };
    return { type: "all" };
  }

  const audienceQuery = useQuery({
    queryKey: [
      "email-audience",
      audience.type,
      selectedRoles,
      selectedBilling,
      customEmails,
    ],
    queryFn: () => {
      const a = buildAudience();
      return adminApi.previewAudienceCount(a);
    },
    enabled: !!subject,
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      adminApi.previewEmail({
        subject,
        previewText,
        templateSlug,
        theme,
        props,
      }),
    onSuccess: (data) => setPreviewHtml(data.html),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      adminApi.sendEmail({
        subject,
        previewText,
        templateSlug,
        theme,
        props,
        audience: buildAudience(),
      }),
    onSuccess: (data) => setSent({ sent: data.sent, total: data.total }),
  });

  const handlePreview = useCallback(() => {
    if (!subject || !props.headline || !props.body) return;
    previewMutation.mutate();
  }, [subject, props, templateSlug, theme, previewText, previewMutation]);

  return (
    <div className={styles.root}>
      {sent && (
        <div className={styles.successBanner}>
          Відправлено {sent.sent} з {sent.total} отримувачів
          <button
            type="button"
            onClick={() => setSent(null)}
            className={styles.dismissBtn}
          >
            ×
          </button>
        </div>
      )}
      <div className={styles.layout}>
        {/* Left: Settings */}
        <div className={styles.panel}>
          <div className={styles.section}>
            <label className={styles.label}>Тема листа</label>
            <input
              className={styles.input}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Введіть тему..."
            />
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Текст анонсу</label>
            <input
              className={styles.input}
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Короткий анонс у папці вхідних..."
            />
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Шаблон</label>
            <select
              className={styles.select}
              value={templateSlug}
              onChange={(e) => setTemplateSlug(e.target.value)}
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Тема оформлення</label>
            <div className={styles.themeGrid}>
              {(
                themesQuery.data || [
                  { slug: "default", name: "Default" },
                  { slug: "teal", name: "Teal" },
                  { slug: "violet", name: "Violet" },
                  { slug: "sun", name: "Sun" },
                ]
              ).map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  className={`${styles.themeBtn} ${theme === t.slug ? styles.themeBtnActive : ""}`}
                  onClick={() => setTheme(t.slug)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Аудиторія</label>
            <select
              className={styles.select}
              value={audience.type}
              onChange={(e) =>
                setAudience({ type: e.target.value as EmailAudience["type"] })
              }
            >
              {AUDIENCE_TYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            {audience.type === "role" && (
              <div className={styles.checkboxGroup}>
                {ROLES.map((r) => (
                  <label key={r} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(r)}
                      onChange={(e) =>
                        setSelectedRoles(
                          e.target.checked
                            ? [...selectedRoles, r]
                            : selectedRoles.filter((x) => x !== r),
                        )
                      }
                    />
                    {r}
                  </label>
                ))}
              </div>
            )}
            {audience.type === "billing" && (
              <div className={styles.checkboxGroup}>
                {BILLING_PLANS.map((p) => (
                  <label key={p} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedBilling.includes(p)}
                      onChange={(e) =>
                        setSelectedBilling(
                          e.target.checked
                            ? [...selectedBilling, p]
                            : selectedBilling.filter((x) => x !== p),
                        )
                      }
                    />
                    {p}
                  </label>
                ))}
              </div>
            )}
            {audience.type === "custom" && (
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder="Один email на рядок"
                value={customEmails}
                onChange={(e) => setCustomEmails(e.target.value)}
              />
            )}
            {audienceQuery.data !== undefined && (
              <div className={styles.audienceCount}>
                Отримувачів: <strong>{audienceQuery.data.count}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Content */}
        <div className={styles.panel}>
          <div className={styles.section}>
            <label className={styles.label}>Заголовок</label>
            <input
              className={styles.input}
              value={props.headline}
              onChange={(e) =>
                setProps((p) => ({ ...p, headline: e.target.value }))
              }
              placeholder="Основний заголовок листа..."
            />
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Текст листа</label>
            <textarea
              className={styles.textarea}
              rows={8}
              value={props.body}
              onChange={(e) =>
                setProps((p) => ({ ...p, body: e.target.value }))
              }
              placeholder="Основний текст повідомлення..."
            />
          </div>
          {templateSlug === "maintenance" && (
            <>
              <div className={styles.section}>
                <label className={styles.label}>
                  Початок (необов&apos;язково)
                </label>
                <input
                  className={styles.input}
                  value={(props as Record<string, string>).startTime || ""}
                  onChange={(e) =>
                    setProps((p) => ({ ...p, startTime: e.target.value }))
                  }
                  placeholder="наприклад: 10 червня, 22:00"
                />
              </div>
              <div className={styles.section}>
                <label className={styles.label}>
                  Завершення (необов&apos;язково)
                </label>
                <input
                  className={styles.input}
                  value={(props as Record<string, string>).endTime || ""}
                  onChange={(e) =>
                    setProps((p) => ({ ...p, endTime: e.target.value }))
                  }
                  placeholder="наприклад: 11 червня, 02:00"
                />
              </div>
            </>
          )}
          {templateSlug === "product-update" && (
            <div className={styles.section}>
              <label className={styles.label}>
                Нові можливості (необов&apos;язково)
              </label>
              <textarea
                className={styles.textarea}
                rows={4}
                value={(props as Record<string, string>).features || ""}
                onChange={(e) =>
                  setProps((p) => ({
                    ...p,
                    features: e.target.value.split("\n"),
                  }))
                }
                placeholder="Один рядок — одна функція"
              />
            </div>
          )}
          <div className={styles.section}>
            <label className={styles.label}>
              Кнопка CTA (необов&apos;язково)
            </label>
            <input
              className={styles.input}
              value={props.ctaText}
              onChange={(e) =>
                setProps((p) => ({ ...p, ctaText: e.target.value }))
              }
              placeholder="Текст кнопки"
            />
            <input
              className={`${styles.input} ${styles.inputMt}`}
              value={props.ctaUrl}
              onChange={(e) =>
                setProps((p) => ({ ...p, ctaUrl: e.target.value }))
              }
              placeholder="URL кнопки"
            />
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handlePreview}
              disabled={previewMutation.isPending || !subject}
            >
              {previewMutation.isPending ? "Генерую..." : "Переглянути"}
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => sendMutation.mutate()}
              disabled={
                sendMutation.isPending ||
                !subject ||
                !props.headline ||
                !props.body
              }
            >
              {sendMutation.isPending ? "Надсилаю..." : "Надіслати"}
            </button>
          </div>
          {sendMutation.isError && (
            <div className={styles.errorMsg}>
              Помилка: {(sendMutation.error as Error).message}
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>Живий перегляд</div>
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className={styles.previewFrame}
              title="Email preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className={styles.previewPlaceholder}>
              Заповніть форму та натисніть &quot;Переглянути&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
