"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  FolderKanban,
  GraduationCap,
  MessagesSquare,
  Scale,
  Shield,
  Target,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import {
  RoleAccessGate,
  RoleHydrationShell,
  RoleWorkspace,
} from "@/features/role-workspace/roleWorkspace";
import shellStyles from "@/features/role-workspace/roleWorkspace.module.scss";
import styles from "./page.module.scss";

const CAPABILITIES = [
  {
    title: "Керує групами",
    text: "Створює навчальні або робочі групи, бачить склад, навантаження й фокусні закони кожної команди.",
    icon: Users,
  },
  {
    title: "Моніторить зміни",
    text: "Відстежує forks, proposals, amendments і бачить, хто саме ініціював або допрацював зміну.",
    icon: FolderKanban,
  },
  {
    title: "Перевіряє якість",
    text: "Оцінює логіку правки, її обґрунтування, узгодженість з нормою та готовність до review.",
    icon: Shield,
  },
  {
    title: "Дає зворотний зв'язок",
    text: "Повертає на доопрацювання, підсвічує слабкі місця та допомагає групі довести напрацювання до якісного рівня.",
    icon: MessagesSquare,
  },
  {
    title: "Бачить аналітику",
    text: "Оцінює активність студентів або членів групи, кількість дій, статуси й темп роботи по законах.",
    icon: BarChart3,
  },
  {
    title: "Працює як куратор процесу",
    text: "Підтримує освітній, стажувальний або експертний сценарій без підміни автора змін чи системного адміністратора.",
    icon: GraduationCap,
  },
] as const;

const MAY_DO = [
  "Створювати та вести власні групи.",
  "Бачити активність учасників по конкретних законах.",
  "Переглядати diff між original та fork.",
  "Аналізувати proposals, amendments і коментарі.",
  "Фіксувати сигнали ризику та повертати правки на доопрацювання.",
  "Використовувати платформу як навчальний або експертний інструмент.",
] as const;

const CANNOT_DO = [
  "Не керує всіма користувачами платформи як Admin.",
  "Не змінює глобальні системні налаштування.",
  "Не редагує приховано історію правок.",
  "Не підміняє собою автора нормотворчої пропозиції.",
  "Не присвоює системні ролі поза затвердженим флоу доступу.",
  "Не є офіційною державною посадою в межах продукту.",
] as const;

const WORKFLOW = [
  {
    step: "01",
    title: "Формує групу",
    text: "Визначає склад, курс або робочу команду та фокусні закони для опрацювання.",
  },
  {
    step: "02",
    title: "Призначає фокус",
    text: "Направляє увагу групи на статті, проблемні норми або законопроєкти з високим пріоритетом.",
  },
  {
    step: "03",
    title: "Спостерігає за активністю",
    text: "Дивиться, хто створює форки, хто готує зміни, а хто лише читає та аналізує матеріал.",
  },
  {
    step: "04",
    title: "Перевіряє якість",
    text: "Оцінює формулювання, аргументацію, узгодженість із нормою та наявність правового сенсу.",
  },
  {
    step: "05",
    title: "Дає фідбек",
    text: "Підсвічує слабкі місця, дублікати, колізії, брак джерел або нечіткість редакції.",
  },
  {
    step: "06",
    title: "Готує до review",
    text: "Допомагає групі сформувати якісний пакет змін, придатний до подальшого розгляду.",
  },
] as const;

const QUALITY_RULES = [
  "Правка має чітко показувати, що саме додається, змінюється або вилучається.",
  "Формулювання не повинно суперечити іншим нормам або створювати очевидну колізію.",
  "До зміни має бути зрозуміле юридичне або практичне обґрунтування.",
  "Supervisor перевіряє не політичну позицію, а якість логіки, структури та прозорість редакції.",
  "Дублікати та сирі чернетки мають повертатися на доопрацювання до етапу review.",
  "Пріоритет віддається юридичній визначеності, відтворюваності та пояснюваності зміни.",
] as const;

const UK_CONTEXT = [
  {
    title: "Освітній сценарій",
    text: "Платформа може використовуватися в університетах, юридичних клініках, стажуваннях і bootcamp-групах.",
    icon: BookOpen,
  },
  {
    title: "Експертний сценарій",
    text: "Supervisor може виступати куратором аналітичної або профільної команди, що готує узгоджені напрацювання.",
    icon: Target,
  },
  {
    title: "Український контекст",
    text: "Роль не замінює офіційний парламентський процес, а підтримує аналіз, підготовку змін і громадський контроль.",
    icon: Scale,
  },
] as const;

const FAQ = [
  {
    question: "Чим Supervisor відрізняється від Admin?",
    answer:
      "Supervisor керує своїми групами, змінами та перевіркою якості. Admin керує всією платформою, користувачами й системними налаштуваннями.",
  },
  {
    question: "Чи може Supervisor сам редагувати закони?",
    answer:
      "Так, якщо він одночасно має роль lawmaker або інший дозволений контекст, але роль Supervisor у першу чергу про нагляд, перевірку і координацію.",
  },
  {
    question: "Що саме він бачить по групі?",
    answer:
      "Склад групи, активність учасників, кількість forks, proposals, amendments, останні дії та прогрес по вибраних законах.",
  },
  {
    question: "За якими критеріями оцінюються правки?",
    answer:
      "За ясністю зміни, узгодженістю з нормою, відсутністю колізій, повнотою обґрунтування та придатністю до подальшого review.",
  },
  {
    question: "Чи це юридична експертиза в офіційному значенні?",
    answer:
      "Ні. Це інструмент внутрішнього нагляду, навчання, аналітики та підготовки напрацювань у межах продуктового процесу.",
  },
] as const;

const SUMMARY_METRICS = [
  {
    label: "Зони відповідальності",
    value: "4",
    note: "Групи, зміни, якість, аналітика",
    icon: Eye,
  },
  {
    label: "Типи контролю",
    value: "6",
    note: "Forks, proposals, amendments, comments, activity, review",
    icon: FileText,
  },
  {
    label: "Критерії якості",
    value: "6",
    note: "Логіка, структура, обґрунтування, колізії, прозорість, готовність",
    icon: CheckCircle2,
  },
  {
    label: "Основний режим",
    value: "Нагляд",
    note: "Supervisor не підміняє автора і не є системним адміном",
    icon: Shield,
  },
] as const;

export default function SupervisorRulesPage() {
  const { user, isSupervisor, isAdmin, isHydrated } = useAuth();

  if (!isHydrated) {
    return <RoleHydrationShell />;
  }

  if (!isSupervisor && !isAdmin) {
    return (
      <RoleAccessGate
        eyebrow="SUPERVISOR ACCESS"
        title="Правила та повноваження доступні лише для ролі Supervisor"
        text="Ця сторінка пояснює робочі межі, стандарти оцінки та сценарії нагляду для викладачів, менторів і керівників груп у Law Analysis."
        primaryHref={ROUTES.rolesSupervisor}
        primaryLabel="Публічна сторінка ролі"
        secondaryHref={ROUTES.help}
        secondaryLabel="Як отримати доступ"
      />
    );
  }

  const initials = (user?.displayName ?? "SV").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin ? "Адміністратор" : "Супервайзер";

  return (
    <RoleWorkspace
      role="supervisor"
      initials={initials}
      name={user?.displayName ?? "Supervisor"}
      roleLabel={roleLabel}
    >
      <div className={shellStyles.page}>
        <section className={`${shellStyles.panel} ${styles.heroPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>
                SUPERVISOR · ПРАВИЛА ТА ПОВНОВАЖЕННЯ
              </span>
              <h1 className={shellStyles.pageTitle}>
                Роль нагляду, координації та перевірки якості.
              </h1>
              <p className={shellStyles.pageSubtitle}>
                Супервайзер у Law Analysis керує групою, контролює прозорість
                змін, перевіряє якість напрацювань і підтримує навчальний або
                експертний процес без підміни автора законодавчої правки.
              </p>
            </div>

            <aside className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <Shield size={18} />
                <span>Supervisor frame</span>
              </div>
              <strong>
                Керує процесом, а не приховано переписує результат.
              </strong>
              <p>
                Фокус ролі: групи, моніторинг законів, контроль якості,
                аналітика активності та підготовка змін до review.
              </p>
              <div className={styles.summaryActions}>
                <Link
                  href={ROUTES.supervisorDashboard}
                  className="btn btn-primary"
                >
                  Відкрити дашборд
                </Link>
                <Link
                  href={ROUTES.supervisorGroups}
                  className="btn btn-outline"
                >
                  Мої групи
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section className={shellStyles.kpiGrid}>
          {SUMMARY_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <article key={metric.label} className={shellStyles.kpiCard}>
                <p className={shellStyles.kpiLabel}>{metric.label}</p>
                <div className={styles.metricTop}>
                  <h2 className={shellStyles.kpiValue}>{metric.value}</h2>
                  <span className={styles.metricIcon}>
                    <Icon size={18} />
                  </span>
                </div>
                <p className={shellStyles.kpiNote}>{metric.note}</p>
              </article>
            );
          })}
        </section>

        <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>ЩО МОЖЕ SUPERVISOR</span>
              <h2 className={styles.sectionTitle}>
                Операційні можливості ролі
              </h2>
            </div>
          </div>

          <div className={styles.capabilityGrid}>
            {CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className={styles.capabilityCard}>
                  <span className={styles.capabilityIcon}>
                    <Icon size={18} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <div className={styles.splitGrid}>
          <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
            <div className={styles.listCardHeader}>
              <span className={shellStyles.eyebrow}>МОЖЕ</span>
              <h2 className={styles.sectionTitle}>Дозволені дії</h2>
            </div>
            <ul className={styles.ruleList}>
              {MAY_DO.map((item) => (
                <li key={item} className={styles.ruleItem}>
                  <CheckCircle2 size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
            <div className={styles.listCardHeader}>
              <span className={shellStyles.eyebrow}>НЕ МОЖЕ</span>
              <h2 className={styles.sectionTitle}>Межі повноважень</h2>
            </div>
            <ul className={styles.ruleList}>
              {CANNOT_DO.map((item) => (
                <li
                  key={item}
                  className={`${styles.ruleItem} ${styles.ruleItemMuted}`}
                >
                  <Target size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>РОБОЧИЙ ПРОЦЕС</span>
              <h2 className={styles.sectionTitle}>Як Supervisor веде групу</h2>
              <p className={shellStyles.pageSubtitle}>
                Це базовий сценарій для університетського, менторського або
                експертного середовища в межах українського законодавчого
                аналізу.
              </p>
            </div>
          </div>

          <div className={styles.workflowGrid}>
            {WORKFLOW.map((item) => (
              <article key={item.step} className={styles.workflowCard}>
                <span className={styles.workflowIndex}>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>СТАНДАРТ ЯКОСТІ</span>
              <h2 className={styles.sectionTitle}>Як перевіряти правки</h2>
            </div>
          </div>

          <div className={styles.qualityGrid}>
            {QUALITY_RULES.map((item) => (
              <article key={item} className={styles.qualityCard}>
                <CheckCircle2 size={16} />
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>УКРАЇНСЬКИЙ КОНТЕКСТ</span>
              <h2 className={styles.sectionTitle}>
                Для чого ця роль у системі
              </h2>
            </div>
          </div>

          <div className={styles.contextGrid}>
            {UK_CONTEXT.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className={styles.contextCard}>
                  <span className={styles.contextIcon}>
                    <Icon size={18} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>FAQ</span>
              <h2 className={styles.sectionTitle}>Поширені питання</h2>
            </div>
          </div>

          <div className={styles.faqGrid}>
            {FAQ.map((item) => (
              <article key={item.question} className={styles.faqCard}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.footerPanel}`}>
          <div className={styles.footerCopy}>
            <span className={shellStyles.eyebrow}>NEXT STEP</span>
            <h2 className={styles.sectionTitle}>
              Працюйте як куратор змін, а не як прихований редактор.
            </h2>
            <p className={shellStyles.pageSubtitle}>
              Найсильніший сценарій для Supervisor у MVP-4: формувати групу,
              тримати фокус на конкретних законах, підсвічувати слабкі місця та
              доводити напрацювання до якісного review-ready стану.
            </p>
          </div>
          <div className={styles.footerActions}>
            <Link href={ROUTES.supervisorDashboard} className="btn btn-primary">
              До дашборду
            </Link>
            <Link href={ROUTES.supervisorGroups} className="btn btn-outline">
              До груп <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </RoleWorkspace>
  );
}
