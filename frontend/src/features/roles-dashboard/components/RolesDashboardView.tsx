import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  FileText,
  Gavel,
  GitFork,
  LockKeyhole,
  MoveRight,
  Scale,
  Search,
  ShieldCheck,
  User,
  UserRound,
  Users,
} from "lucide-react";
import { ScalesIcon } from "@/components/home/premium/icons";
import { ROUTES } from "@/constants/routes";
import styles from "./RolesDashboardView.module.scss";

type RoleKey = "guest" | "user" | "lawmaker" | "supervisor" | "admin";

type RoleCard = {
  key: RoleKey;
  badge: string;
  title: string;
  description: string;
  features: string[];
  href: string;
  Icon: LucideIcon;
};

type Highlight = {
  text: string;
  Icon: LucideIcon;
};

type JourneyStep = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

type CapabilityRow = {
  label: string;
  Icon: LucideIcon;
  access: Record<RoleKey, boolean>;
};

type FaqItem = {
  question: string;
  answer: string;
};

const roleCards: RoleCard[] = [
  {
    key: "guest",
    badge: "Гість",
    title: "Гість",
    description:
      "Доступ без реєстрації для ознайомлення з законодавством та публічною інформацією.",
    features: [
      "Перегляд законів",
      "Пошук",
      "Суб'єкти та аналіз (публічний доступ)",
    ],
    href: ROUTES.rolesGuest,
    Icon: UserRound,
  },
  {
    key: "user",
    badge: "Користувач",
    title: "Користувач",
    description:
      "Активний учасник, який пропонує зміни та долучається до обговорень.",
    features: [
      "Перегляд та пошук законів",
      "Пропонуйте цільові зміни",
      "Голосуйте за пропозиції спільноти",
    ],
    href: ROUTES.rolesUser,
    Icon: User,
  },
  {
    key: "lawmaker",
    badge: "Законотворець",
    title: "Законотворець",
    description:
      "Створює альтернативні версії законів та готує пропозиції до розгляду.",
    features: [
      "Створюйте форки та поправки",
      "Порівнюйте версії змін",
      "Подавайте на розгляд спільноті",
    ],
    href: ROUTES.rolesLawmaker,
    Icon: Scale,
  },
  {
    key: "supervisor",
    badge: "Супервайзер",
    title: "Супервайзер",
    description:
      "Керує групою, відстежує активність та перевіряє роботу студентів.",
    features: [
      "Створюйте та керуйте групами",
      "Моніторинг активності та форків",
      "Порівняння версій і перевірка робіт",
    ],
    href: ROUTES.rolesSupervisor,
    Icon: Users,
  },
  {
    key: "admin",
    badge: "Адміністратор",
    title: "Адміністратор",
    description: "Повний контроль над платформою, користувачами та контентом.",
    features: [
      "Управління користувачами",
      "Управління законами та контентом",
      "Модерація, аудит, налаштування системи",
    ],
    href: ROUTES.rolesAdmin,
    Icon: ShieldCheck,
  },
];

const highlights: Highlight[] = [
  { text: "Достовірні дані законодавства", Icon: ShieldCheck },
  { text: "Спільнота експертів та користувачів", Icon: Users },
  { text: "Прозорість процесів і змін", Icon: BarChart3 },
  { text: "Безпечно та надійно", Icon: LockKeyhole },
];

const journeySteps: JourneyStep[] = [
  {
    title: "Гість",
    description: "Ознайомлення та публічний доступ",
    Icon: UserRound,
  },
  {
    title: "Користувач",
    description: "Участь та пропозиції в спільноті",
    Icon: User,
  },
  {
    title: "Законотворець",
    description: "Підготовка змін та альтернатив",
    Icon: FileText,
  },
  {
    title: "Супервайзер",
    description: "Керування групою та контроль якості",
    Icon: Users,
  },
  {
    title: "Адміністратор",
    description: "Повне управління платформою",
    Icon: ShieldCheck,
  },
];

const capabilityRows: CapabilityRow[] = [
  {
    label: "Перегляд законів",
    Icon: FileText,
    access: {
      guest: true,
      user: true,
      lawmaker: true,
      supervisor: true,
      admin: true,
    },
  },
  {
    label: "Пошук",
    Icon: Search,
    access: {
      guest: true,
      user: true,
      lawmaker: true,
      supervisor: true,
      admin: true,
    },
  },
  {
    label: "Суб'єкти та аналіз",
    Icon: BarChart3,
    access: {
      guest: true,
      user: true,
      lawmaker: true,
      supervisor: true,
      admin: true,
    },
  },
  {
    label: "Пропозиції змін",
    Icon: BadgeCheck,
    access: {
      guest: false,
      user: true,
      lawmaker: true,
      supervisor: true,
      admin: true,
    },
  },
  {
    label: "Форки законопроєктів",
    Icon: GitFork,
    access: {
      guest: false,
      user: false,
      lawmaker: true,
      supervisor: true,
      admin: true,
    },
  },
  {
    label: "Моніторинг груп",
    Icon: Users,
    access: {
      guest: false,
      user: false,
      lawmaker: false,
      supervisor: true,
      admin: true,
    },
  },
  {
    label: "Модерація",
    Icon: Gavel,
    access: {
      guest: false,
      user: false,
      lawmaker: false,
      supervisor: false,
      admin: true,
    },
  },
  {
    label: "Управління користувачами",
    Icon: ShieldCheck,
    access: {
      guest: false,
      user: false,
      lawmaker: false,
      supervisor: false,
      admin: true,
    },
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Як отримати роль законотворця?",
    answer:
      "Зареєструйтеся, станьте активним користувачем і подайте заявку. Після перевірки ви отримаєте доступ до створення форок і поправок.",
  },
  {
    question: "Чим супервайзер відрізняється від адміністратора?",
    answer:
      "Супервайзер керує своєю групою та перевіряє роботи студентів, а адміністратор має повний контроль над платформою.",
  },
  {
    question: "Чи можна почати без реєстрації?",
    answer:
      "Так, як гість ви можете переглядати закони, шукати та аналізувати публічні дані без створення акаунту.",
  },
];

function CapabilityMark({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return <span className={styles.capabilityNo}>—</span>;
  }

  return (
    <span className={styles.capabilityYes}>
      <CheckCircle2 size={16} />
    </span>
  );
}

export function RolesDashboardView() {
  return (
    <section className={styles.page}>
      <div className={styles.pageGlowTop} aria-hidden="true" />
      <div className={styles.pageGlowBottom} aria-hidden="true" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={`mono ${styles.eyebrow}`}>Ролі платформи</span>
          <h1 className={`display ${styles.heroTitle}`}>
            Оберіть роль у <span>Law Analysis</span>
          </h1>
          <p className={styles.heroDescription}>
            Кожна роль відкриває різні рівні доступу, інструменти та
            відповідальність для роботи із законодавством та спільнотою.
          </p>
        </div>

        <div className={styles.heroAside}>
          <article className={styles.heroPromo}>
            <div className={styles.heroPromoIcon}>
              <Gavel size={34} />
            </div>
            <div className={styles.heroPromoBody}>
              <h2 className={`display ${styles.heroPromoTitle}`}>
                Досліджуйте, аналізуйте, пропонуйте зміни та керуйте процесом в
                одному середовищі.
              </h2>
              <div className={styles.heroPromoActions}>
                <Link href={ROUTES.authRegister} className="btn btn-primary">
                  Створити акаунт
                </Link>
                <Link href={ROUTES.projectInfo} className="btn btn-outline">
                  Дізнатися про можливості
                </Link>
              </div>
            </div>
          </article>

          <ul className={styles.highlightList}>
            {highlights.map(({ text, Icon }) => (
              <li key={text} className={styles.highlightItem}>
                <span className={styles.highlightIcon}>
                  <Icon size={18} />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.roleGrid} aria-label="Ролі платформи">
        {roleCards.map(
          ({ key, badge, title, description, features, href, Icon }) => (
            <article key={key} className={styles.roleCard}>
              <div className={styles.roleCardHeader}>
                <div className={styles.roleIconWrap}>
                  <Icon size={28} />
                </div>
                <span className={`mono ${styles.roleBadge}`}>{badge}</span>
              </div>

              <h2 className={`display ${styles.roleTitle}`}>{title}</h2>
              <p className={styles.roleDescription}>{description}</p>

              <ul className={styles.roleFeatureList}>
                {features.map((feature) => (
                  <li key={feature} className={styles.roleFeatureItem}>
                    <CheckCircle2 size={14} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={href} className={styles.roleCta}>
                <span>Детальніше</span>
                <ArrowRight size={16} />
              </Link>
            </article>
          ),
        )}
      </section>

      <section className={styles.journeyPanel}>
        <div className={styles.journeyIntro}>
          <span className={`display ${styles.journeyTitle}`}>Шлях ролей</span>
          <p className={styles.journeyDescription}>
            Від ознайомлення до управління: зростає доступ, інструменти та
            відповідальність.
          </p>
        </div>

        <div className={styles.journeySteps}>
          {journeySteps.map(({ title, description, Icon }, index) => (
            <div key={title} className={styles.journeyStep}>
              <div className={styles.journeyStepInner}>
                <span className={styles.journeyIconWrap}>
                  <Icon size={24} />
                </span>
                <div className={styles.journeyCopy}>
                  <strong className={`display ${styles.journeyStepTitle}`}>
                    {title}
                  </strong>
                  <span className={styles.journeyStepDescription}>
                    {description}
                  </span>
                </div>
              </div>
              {index < journeySteps.length - 1 ? (
                <MoveRight size={18} className={styles.journeyArrow} />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.matrixPanel}>
          <div className={styles.matrixIntro}>
            <div>
              <h2 className={`display ${styles.panelTitle}`}>
                Порівняння можливостей
              </h2>
              <p className={styles.panelDescription}>
                Хто може виконувати ключові дії на платформі.
              </p>
            </div>
          </div>

          <div className={styles.matrixScroller}>
            <div className={styles.matrixTable}>
              <div className={styles.matrixHead}>
                <div className={styles.matrixHeadSpacer} />
                {roleCards.map(({ key, title }) => (
                  <div key={key} className={styles.matrixHeadCell}>
                    {title}
                  </div>
                ))}
              </div>

              {capabilityRows.map(({ label, Icon, access }) => (
                <div key={label} className={styles.matrixRow}>
                  <div className={styles.matrixLabelCell}>
                    <span className={styles.matrixLabelIcon}>
                      <Icon size={15} />
                    </span>
                    <span>{label}</span>
                  </div>
                  {roleCards.map(({ key }) => (
                    <div key={`${label}-${key}`} className={styles.matrixCell}>
                      <CapabilityMark enabled={access[key]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className={styles.faqPanel}>
          <div className={styles.faqIntro}>
            <h2 className={`display ${styles.panelTitle}`}>
              Питання та відповіді
            </h2>
          </div>

          <div className={styles.faqList}>
            {faqItems.map(({ question, answer }) => (
              <details key={question} className={styles.faqItem} open>
                <summary className={styles.faqSummary}>
                  <span className={styles.faqQuestionWrap}>
                    <CircleHelp size={18} />
                    <span>{question}</span>
                  </span>
                  <span className={styles.faqToggle}>⌃</span>
                </summary>
                <p className={styles.faqAnswer}>{answer}</p>
              </details>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.ctaPanel}>
        <div className={styles.ctaIconWrap}>
          <ScalesIcon size={60} className={styles.ctaIcon} />
        </div>

        <div className={styles.ctaCopy}>
          <h2 className={`display ${styles.ctaTitle}`}>
            Почніть із ролі, яка відповідає вашим задачам
          </h2>
          <p className={styles.ctaDescription}>
            Обирайте свій шлях і працюйте ефективно з законодавством разом із
            спільнотою Law Analysis.
          </p>
        </div>

        <div className={styles.ctaActions}>
          <Link
            href={ROUTES.authRegister}
            className={`btn btn-primary ${styles.ctaButton}`}
          >
            Зареєструватися
          </Link>
          <Link
            href={ROUTES.laws}
            className={`btn btn-outline ${styles.ctaButton}`}
          >
            Переглянути закони
          </Link>
        </div>
      </section>
    </section>
  );
}
