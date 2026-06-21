"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Users,
  ArrowRight,
  Tag,
  CreditCard,
  Activity,
  ChevronDown,
  RefreshCw,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import styles from "./page.module.scss";

type RuleField = "role" | "billing" | "activity";
type RuleOperator = "is" | "is_not" | "includes";

interface Rule {
  id: number;
  field: RuleField;
  operator: RuleOperator;
  value: string;
}

const FIELD_OPTIONS: {
  value: RuleField;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "role", label: "Роль", icon: Tag },
  { value: "billing", label: "Тариф", icon: CreditCard },
  { value: "activity", label: "Активність", icon: Activity },
];

const OPERATOR_OPTIONS: { value: RuleOperator; label: string }[] = [
  { value: "is", label: "є" },
  { value: "is_not", label: "не є" },
  { value: "includes", label: "включає" },
];

const FIELD_VALUES: Record<RuleField, string[]> = {
  role: ["user", "admin", "legislator", "paid_user"],
  billing: ["preview", "trial", "user", "plus", "pro"],
  activity: ["active_7d", "active_30d", "inactive_90d", "never_logged"],
};

const SAVED_SEGMENTS = [
  { id: "vip", name: "VIP користувачі", count: 42, color: "#c8a843" },
  { id: "paid", name: "Платна аудиторія", count: 318, color: "#52b788" },
  { id: "inactive", name: "Неактивні 90+", count: 94, color: "#e9774b" },
];

let nextId = 1;

export default function AdminEmailSegmentsPage() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([
    { id: nextId++, field: "role", operator: "is", value: "user" },
  ]);
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [segmentName, setSegmentName] = useState("");
  const [saved, setSaved] = useState(false);

  const canPreview = rules.length > 0 && rules.every((r) => r.value);

  const audiencePayload = {
    type: "role" as const,
    roles: rules
      .filter((r) => r.field === "role" && r.operator === "is")
      .map((r) => r.value),
  };

  const {
    data: countData,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["segment-preview", rules, logic],
    queryFn: () => adminApi.previewAudienceCount(audiencePayload),
    enabled: canPreview,
  });

  const addRule = useCallback(() => {
    setRules((prev) => [
      ...prev,
      { id: nextId++, field: "role", operator: "is", value: "user" },
    ]);
  }, []);

  const removeRule = useCallback((id: number) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRule = useCallback(
    (id: number, patch: Partial<Omit<Rule, "id">>) => {
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  function handleUseSegment() {
    router.push(`${ROUTES.adminEmailCompose}?segment=custom`);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        {/* Builder */}
        <div className={styles.builder}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Конструктор сегменту</div>
              <div className={styles.logicToggle}>
                <button
                  type="button"
                  className={`${styles.logicBtn} ${logic === "AND" ? styles.logicBtnActive : ""}`}
                  onClick={() => setLogic("AND")}
                >
                  І (AND)
                </button>
                <button
                  type="button"
                  className={`${styles.logicBtn} ${logic === "OR" ? styles.logicBtnActive : ""}`}
                  onClick={() => setLogic("OR")}
                >
                  АБО (OR)
                </button>
              </div>
            </div>

            {/* Rules */}
            <div className={styles.rules}>
              {rules.map((rule, idx) => (
                <div key={rule.id} className={styles.ruleRow}>
                  {idx > 0 && <div className={styles.ruleLogic}>{logic}</div>}
                  <div className={styles.ruleFields}>
                    {/* Field select */}
                    <div className={styles.selectWrap}>
                      <select
                        className={styles.select}
                        value={rule.field}
                        onChange={(e) =>
                          updateRule(rule.id, {
                            field: e.target.value as RuleField,
                            value: FIELD_VALUES[e.target.value as RuleField][0],
                          })
                        }
                      >
                        {FIELD_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={11} className={styles.selectIcon} />
                    </div>

                    {/* Operator select */}
                    <div className={styles.selectWrap}>
                      <select
                        className={styles.select}
                        value={rule.operator}
                        onChange={(e) =>
                          updateRule(rule.id, {
                            operator: e.target.value as RuleOperator,
                          })
                        }
                      >
                        {OPERATOR_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={11} className={styles.selectIcon} />
                    </div>

                    {/* Value select */}
                    <div className={styles.selectWrap}>
                      <select
                        className={styles.select}
                        value={rule.value}
                        onChange={(e) =>
                          updateRule(rule.id, { value: e.target.value })
                        }
                      >
                        {FIELD_VALUES[rule.field].map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={11} className={styles.selectIcon} />
                    </div>

                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeRule(rule.id)}
                      disabled={rules.length === 1}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={styles.addRuleBtn}
              onClick={addRule}
            >
              <Plus size={13} />
              Додати умову
            </button>
          </div>

          {/* Preview result */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Результат вибірки</div>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={() => refetch()}
                disabled={isFetching || !canPreview}
              >
                <RefreshCw
                  size={12}
                  className={isFetching ? styles.spinning : ""}
                />
                Оновити
              </button>
            </div>

            <div className={styles.previewResult}>
              <div className={styles.resultIcon}>
                <Users size={22} style={{ color: "#4a80d4" }} />
              </div>
              <div className={styles.resultNum}>
                {isFetching ? "..." : (countData?.count ?? "—")}
              </div>
              <div className={styles.resultLabel}>користувачів у сегменті</div>
            </div>

            <div className={styles.previewActions}>
              <input
                className={styles.segmentNameInput}
                placeholder="Назва сегменту..."
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
              />
              <button
                type="button"
                className={styles.btnSave}
                onClick={handleSave}
                disabled={!segmentName}
              >
                {saved ? (
                  <CheckCircle2 size={12} style={{ color: "#52b788" }} />
                ) : null}
                {saved ? "Збережено" : "Зберегти"}
              </button>
              <button
                type="button"
                className={styles.btnUse}
                onClick={handleUseSegment}
                disabled={!canPreview}
              >
                Використати
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Saved segments sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Збережені сегменти</div>
            <div className={styles.segmentList}>
              {SAVED_SEGMENTS.map((seg) => (
                <div key={seg.id} className={styles.segmentItem}>
                  <div
                    className={styles.segmentDot}
                    style={{ background: seg.color }}
                  />
                  <div className={styles.segmentInfo}>
                    <div className={styles.segmentName}>{seg.name}</div>
                    <div className={styles.segmentCount}>
                      {seg.count} користувачів
                    </div>
                  </div>
                  <div className={styles.segmentItemActions}>
                    <button
                      type="button"
                      className={styles.segItemBtn}
                      title="Використати у розсилці"
                      onClick={() =>
                        router.push(
                          `${ROUTES.adminEmailCompose}?segment=${seg.id}`,
                        )
                      }
                    >
                      <ArrowRight size={12} />
                    </button>
                    <button
                      type="button"
                      className={styles.segItemBtn}
                      title="Дублювати"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
