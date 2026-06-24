"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileText,
  FolderKanban,
  GitBranch,
  GraduationCap,
  MessagesSquare,
  PenLine,
  Scale,
  Shield,
  Sparkles,
  Target,
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
    title: "Створює forks",
    text: "Законотворець формує альтернативні версії закону або законопроєкту для структурованої роботи над змінами.",
    icon: GitBranch,
  },
  {
    title: "Готує поправки",
    text: "Працює зі статтями, частинами, пунктами та абзацами, додаючи, редагуючи або вилучаючи окремі елементи норми.",
    icon: PenLine,
  },
  {
    title: "Подає proposals",
    text: "Фіксує точкові пропозиції зі старою редакцією, новою редакцією та аргументацією, придатною для review.",
    icon: FileText,
  },
  {
    title: "Перевіряє diff",
    text: "Порівнює original і fork, бачить, що саме було додано, змінено або вилучено перед передачею на розгляд.",
    icon: FolderKanban,
  },
  {
    title: "Працює в групі",
    text: "Координується з іншими учасниками та супервайзером через історію, шаблони, групи й чат робочого кабінету.",
    icon: MessagesSquare,
  },
  {
    title: "Будує пакет змін",
    text: "Не просто редагує норму, а готує прозорий і логічний пакет змін, який можна захистити на review.",
    icon: Sparkles,
  },
] as const;

const MAY_DO = [
  "Створювати forks законів і законопроєктів.",
  "Додавати поправки до статей, частин, пунктів та абзаців.",
  "Створювати proposals із поясненням причини зміни.",
  "Порівнювати original та fork через diff.",
  "Передавати результат на review після самоперевірки.",
  "Використовувати шаблони правок для повторюваних сценаріїв.",
] as const;

const CANNOT_DO = [
  "Не керує групами та не оцінює інших учасників як Supervisor.",
  "Не призначає ролі, не змінює доступи та не керує системою як Admin.",
  "Не приховує історію змін і не редагує аудит заднім числом.",
  "Не публікує результат як офіційний державний акт від імені органу влади.",
  "Не передає сирі, неаргументовані або колізійні правки як готові до review.",
  "Не підміняє proposal коротким коментарем без тексту правки.",
] as const;

const WORKFLOW = [
  {
    step: "01",
    title: "Аналізує норму",
    text: "Відкриває закон, дивиться контекст статті, пов’язані елементи та проблему, яку треба вирішити.",
  },
  {
    step: "02",
    title: "Обирає формат зміни",
    text: "Для короткої ініціативи створює proposal, для комплексної переробки відкриває fork.",
  },
  {
    step: "03",
    title: "Формує текст правки",
    text: "Готує нову редакцію, пояснює юридичний сенс і фіксує, чому саме ця зміна потрібна.",
  },
  {
    step: "04",
    title: "Перевіряє diff",
    text: "Зіставляє original та fork, щоб переконатися у прозорості, повноті та структурності змін.",
  },
  {
    step: "05",
    title: "Узгоджує в групі",
    text: "За потреби синхронізується з іншими учасниками й супервайзером через чат, шаблони та історію.",
  },
  {
    step: "06",
    title: "Передає на review",
    text: "Відправляє результат тільки після того, як зміна стала зрозумілою, аргументованою та review-ready.",
  },
] as const;

const QUALITY_RULES = [
  "Кожна зміна повинна чітко показувати, що саме додається, змінюється або вилучається.",
  "Правка має мати коротке і зрозуміле обґрунтування: юридичне, практичне або системне.",
  "Формулювання не повинно створювати очевидні колізії з іншими нормами.",
  "Якщо зміна системна або зачіпає кілька норм, її слід оформлювати через fork, а не коротку proposal.",
  "Перед review законотворець сам перевіряє diff, структуру, логіку та чистоту формулювань.",
  "Перевага надається ясності, відтворюваності та придатності до колективної перевірки.",
] as const;

const STATUS_RULES = [
  {
    title: "Draft",
    text: "Чернетка ще в роботі: її можна доповнювати, звіряти та обговорювати всередині робочого контуру.",
    icon: FileText,
  },
  {
    title: "Review",
    text: "Зміна передана на перевірку супервайзеру або в наступний етап процесу та очікує рішення.",
    icon: Eye,
  },
  {
    title: "Approved",
    text: "Зміна пройшла перевірку й може бути використана як якісний результат групової роботи.",
    icon: CheckCircle2,
  },
  {
    title: "Rejected",
    text: "Правку повернуто через дублювання, слабку аргументацію, колізію або недостатню готовність.",
    icon: AlertTriangle,
  },
] as const;

const UK_CONTEXT = [
  {
    title: "Освітній тренажер",
    text: "Роль підходить для студентів права, аналітиків і стажерів, які вчаться працювати з нормами не теоретично, а через реальні правки.",
    icon: GraduationCap,
  },
  {
    title: "Експертна підготовка",
    text: "Законотворець може готувати альтернативні редакції, обґрунтування та пакети змін для подальшого розгляду.",
    icon: Scale,
  },
  {
    title: "Прозорість процесу",
    text: "Усі зміни повинні бути видимі, порівнювані та придатні для контролю з боку групи, супервайзера та спільноти.",
    icon: Shield,
  },
] as const;

const FAQ = [
  {
    question: "Коли створювати proposal, а коли fork?",
    answer:
      "Proposal підходить для точкової зміни окремої норми. Fork потрібен тоді, коли ви переробляєте кілька елементів, кілька статей або цілу логіку документа.",
  },
  {
    question: "Чим законотворець відрізняється від Supervisor?",
    answer:
      "Законотворець є автором змін. Supervisor не пише результат замість нього, а перевіряє якість, координує групу та повертає матеріал на доопрацювання.",
  },
  {
    question: "Що означає review-ready стан?",
    answer:
      "Це означає, що є зрозуміла нова редакція, видно стару редакцію, є аргументація, а diff не містить випадкових або сирих фрагментів.",
  },
  {
    question: "Чи можна працювати без групи?",
    answer:
      "Так, але найбільшу користь платформа дає у зв’язці з групою та супервайзером, коли зміни проходять через колективне доопрацювання і перевірку.",
  },
  {
    question: "Чи це офіційне нормотворення від імені держави?",
    answer:
      "Ні. Це цифровий простір для підготовки, аналізу, навчання, порівняння та прозорого review законодавчих змін.",
  },
] as const;

const SUMMARY_METRICS = [
  {
    label: "Основні режими",
    value: "3",
    note: "Proposal, amendment, fork",
    icon: GitBranch,
  },
  {
    label: "Статуси роботи",
    value: "4",
    note: "Draft, Review, Approved, Rejected",
    icon: Eye,
  },
  {
    label: "Контури якості",
    value: "6",
    note: "Логіка, ясність, аргументація, diff, структура, готовність",
    icon: Target,
  },
  {
    label: "Головний фокус",
    value: "Авторство",
    note: "Законотворець створює зміну, а не адмініструє платформу",
    icon: PenLine,
  },
] as const;

export default function LegislatorRulesPage() {
  const { user, isLegislator, isHydrated } = useAuth();

  if (!isHydrated) {
    return <RoleHydrationShell />;
  }

  if (!isLegislator) {
    return (
      <RoleAccessGate
        eyebrow="LAWMAKER ACCESS"
        title="Правила законотворця доступні лише для ролі Lawmaker"
        text="Ця сторінка описує внутрішній стандарт роботи законотворця: як створювати forks, готувати правки, оформлювати proposals і передавати результат на review у Law Analysis."
        primaryHref={ROUTES.rolesLawmaker}
        primaryLabel="Публічна сторінка ролі"
        secondaryHref={ROUTES.help}
        secondaryLabel="Як отримати доступ"
      />
    );
  }

  const initials = (user?.displayName ?? "LM").slice(0, 2).toUpperCase();

  return (
    <RoleWorkspace
      role="legislator"
      initials={initials}
      name={user?.displayName ?? "Законотворець"}
      roleLabel="Законотворець"
    >
      <div className={shellStyles.page}>
        <section className={`${shellStyles.panel} ${styles.heroPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>
                ЗАКОНОТВОРЕЦЬ · ПРАВИЛА ТА ПОВНОВАЖЕННЯ
              </span>
              <h1 className={shellStyles.pageTitle}>
                Роль автора змін, форків і законодавчих пропозицій.
              </h1>
              <p className={shellStyles.pageSubtitle}>
                Законотворець у Law Analysis аналізує закон, готує правки,
                створює fork, порівнює редакції та передає результат на review.
                Усе працює як цілісний контур підготовки змін: від першої ідеї
                до готового review-ready пакета.
              </p>
            </div>

            <aside className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <PenLine size={18} />
                <span>Lawmaker frame</span>
              </div>
              <strong>
                Створює зміни прозоро, аргументовано й у форматі, придатному до
                перевірки.
              </strong>
              <p>
                Фокус ролі: proposals, amendments, forks, diff, шаблони, історія
                та передача результату на наступний етап процесу.
              </p>
              <div className={styles.summaryActions}>
                <Link
                  href={ROUTES.legislatorCabinet}
                  className="btn btn-primary"
                >
                  Відкрити кабінет
                </Link>
                <Link
                  href={ROUTES.legislatorCabinetForks}
                  className="btn btn-outline"
                >
                  Мої форки
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
              <span className={shellStyles.eyebrow}>ЩО МОЖЕ ЗАКОНОТВОРЕЦЬ</span>
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
              <h2 className={styles.sectionTitle}>
                Як законотворець веде зміну
              </h2>
              <p className={shellStyles.pageSubtitle}>
                Це базовий флоу для ролі, яка не просто читає норми, а готує
                повноцінний пакет змін у межах навчального, стажувального або
                експертного процесу.
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
              <h2 className={styles.sectionTitle}>Як готувати сильну правку</h2>
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
              <span className={shellStyles.eyebrow}>СТАТУСИ РОБОТИ</span>
              <h2 className={styles.sectionTitle}>Що означає кожен етап</h2>
            </div>
          </div>

          <div className={styles.contextGrid}>
            {STATUS_RULES.map((item) => {
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
              Пишіть зміни як автор, а не як випадковий коментатор.
            </h2>
            <p className={shellStyles.pageSubtitle}>
              Найсильніший сценарій для ролі законотворця в MVP-4: аналізувати
              норму, робити прозору правку, збирати fork, перевіряти diff і
              передавати сильний результат на review.
            </p>
          </div>
          <div className={styles.footerActions}>
            <Link href={ROUTES.legislatorCabinet} className="btn btn-primary">
              До кабінету
            </Link>
            <Link
              href={ROUTES.legislatorCabinetForks}
              className="btn btn-outline"
            >
              До форків <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </RoleWorkspace>
  );
}
