"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  FlaskConical,
  Mail,
  Key,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  BarChart2,
} from "lucide-react";
import styles from "./page.module.scss";

const DNS_CHECKS = [
  { name: "SPF", status: "ok", value: "v=spf1 include:spf.brevo.com ~all" },
  { name: "DKIM", status: "ok", value: "brevo._domainkey → verified" },
  {
    name: "DMARC",
    status: "warn",
    value: "p=none (рекомендується p=quarantine)",
  },
];

export default function AdminEmailSettingsPage() {
  const [showKey, setShowKey] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<
    "idle" | "sending" | "ok" | "error"
  >("idle");
  const [connStatus, setConnStatus] = useState<
    "idle" | "checking" | "ok" | "error"
  >("ok");
  const [copied, setCopied] = useState(false);

  function handleTestConnection() {
    setConnStatus("checking");
    setTimeout(() => setConnStatus("ok"), 1400);
  }

  function handleTestSend() {
    if (!testEmail) return;
    setTestStatus("sending");
    setTimeout(() => setTestStatus("ok"), 1600);
  }

  function handleCopySender() {
    void navigator.clipboard.writeText("law.analysis.donate@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const apiKey = "xkeysib-••••••••••••••••••••••••••";
  const apiKeyRevealed = "xkeysib-a7f3d92b1c4e8f56ab9c0d1e2f3a4b5c6d7e8f9";

  return (
    <div className={styles.root}>
      {/* 2-column layout */}
      <div className={styles.layout}>
        {/* Left: Provider + Sender */}
        <div className={styles.leftCol}>
          {/* Provider card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Провайдер розсилок</div>
              <div
                className={`${styles.connChip} ${styles[`connChip_${connStatus}`]}`}
              >
                {connStatus === "checking" && (
                  <RefreshCw size={11} className={styles.spinning} />
                )}
                {connStatus === "ok" && <CheckCircle2 size={11} />}
                {connStatus === "error" && <XCircle size={11} />}
                {connStatus === "idle" && <AlertTriangle size={11} />}
                {connStatus === "checking"
                  ? "Перевірка..."
                  : connStatus === "ok"
                    ? "Підключено"
                    : connStatus === "error"
                      ? "Помилка"
                      : "Не перевірено"}
              </div>
            </div>

            <div className={styles.providerLogo}>
              <BarChart2 size={22} style={{ color: "#4a80d4" }} />
              <div>
                <div className={styles.providerName}>Brevo</div>
                <div className={styles.providerSub}>
                  Sendinblue — Transactional email
                </div>
              </div>
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  <Key size={11} /> API ключ
                </div>
                <div className={styles.fieldValue}>
                  <span className={styles.apiKey}>
                    {showKey ? apiKeyRevealed : apiKey}
                  </span>
                  <button
                    className={styles.iconBtn}
                    onClick={() => setShowKey((v) => !v)}
                    title="Показати"
                  >
                    {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleTestConnection}
                disabled={connStatus === "checking"}
              >
                <FlaskConical size={12} />
                {connStatus === "checking"
                  ? "Перевіряю..."
                  : "Перевірити з'єднання"}
              </button>
            </div>
          </div>

          {/* Sender card */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Відправник</div>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  <Mail size={11} /> Email відправника
                </div>
                <div className={styles.fieldValue}>
                  <span>law.analysis.donate@gmail.com</span>
                  <button
                    className={styles.iconBtn}
                    onClick={handleCopySender}
                    title="Скопіювати"
                  >
                    {copied ? (
                      <CheckCircle2 size={12} style={{ color: "#52b788" }} />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  <Mail size={11} /> Ім'я відправника
                </div>
                <div className={styles.fieldValueText}>Law Analysis</div>
              </div>
            </div>
          </div>

          {/* Test send card */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Тестова розсилка</div>
            <div className={styles.testSendWrap}>
              <input
                className={styles.testInput}
                type="email"
                placeholder="Введіть email для тесту..."
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleTestSend}
                disabled={!testEmail || testStatus === "sending"}
              >
                {testStatus === "sending" ? (
                  <RefreshCw size={12} className={styles.spinning} />
                ) : (
                  <FlaskConical size={12} />
                )}
                {testStatus === "sending" ? "Надсилаю..." : "Надіслати тест"}
              </button>
            </div>
            {testStatus === "ok" && (
              <div className={styles.testOk}>
                <CheckCircle2 size={13} /> Тестовий лист надіслано на{" "}
                {testEmail}
              </div>
            )}
            {testStatus === "error" && (
              <div className={styles.testErr}>
                <XCircle size={13} /> Помилка відправки. Перевірте API ключ.
              </div>
            )}
          </div>
        </div>

        {/* Right: DNS + Quota */}
        <div className={styles.rightCol}>
          {/* DNS checks */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Globe size={13} /> DNS / Автентифікація
            </div>
            <div className={styles.dnsList}>
              {DNS_CHECKS.map((d) => (
                <div key={d.name} className={styles.dnsRow}>
                  <div className={styles.dnsLeft}>
                    <div
                      className={`${styles.dnsIcon} ${d.status === "ok" ? styles.dnsIconOk : styles.dnsIconWarn}`}
                    >
                      {d.status === "ok" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                    </div>
                    <div>
                      <div className={styles.dnsName}>{d.name}</div>
                      <div className={styles.dnsValue}>{d.value}</div>
                    </div>
                  </div>
                  <div
                    className={`${styles.dnsBadge} ${d.status === "ok" ? styles.dnsBadgeOk : styles.dnsBadgeWarn}`}
                  >
                    {d.status === "ok" ? "OK" : "Попередження"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Domain */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <ShieldCheck size={13} /> Домен відправника
            </div>
            <div className={styles.domainRow}>
              <div className={styles.domainIcon}>
                <CheckCircle2 size={16} style={{ color: "#52b788" }} />
              </div>
              <div>
                <div className={styles.domainName}>gmail.com</div>
                <div className={styles.domainStatus}>Верифіковано Brevo</div>
              </div>
            </div>
          </div>

          {/* Quota */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Квота відправки</div>
            <div className={styles.quotaRow}>
              <div className={styles.quotaLabel}>Сьогодні</div>
              <div className={styles.quotaNum}>
                <span className={styles.quotaUsed}>248</span>
                <span className={styles.quotaMax}> / 300</span>
              </div>
            </div>
            <div className={styles.quotaBar}>
              <div
                className={styles.quotaFill}
                style={{ width: `${(248 / 300) * 100}%` }}
              />
            </div>
            <div className={styles.quotaRow} style={{ marginTop: 12 }}>
              <div className={styles.quotaLabel}>Цього місяця</div>
              <div className={styles.quotaNum}>
                <span className={styles.quotaUsed}>1 248</span>
                <span className={styles.quotaMax}> / 9 000</span>
              </div>
            </div>
            <div className={styles.quotaBar}>
              <div
                className={styles.quotaFill}
                style={{
                  width: `${(1248 / 9000) * 100}%`,
                  background: "#52b788",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
