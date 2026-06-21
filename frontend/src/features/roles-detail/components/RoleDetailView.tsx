import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MoveRight,
  Sparkles,
} from "lucide-react";
import { ScalesIcon } from "@/components/home/premium/icons";
import { ROUTES } from "@/constants/routes";
import type { RoleDetailConfig } from "../lib/roleDetailConfigs";
import styles from "./RoleDetailView.module.scss";

export function RoleDetailView({ config }: { config: RoleDetailConfig }) {
  const { Icon, nextStep } = config;

  return (
    <section className={styles.page}>
      <div className={styles.glowTop} aria-hidden="true" />
      <div className={styles.glowBottom} aria-hidden="true" />

      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href={ROUTES.rolesDashboard} className={styles.breadcrumbLink}>
          <ArrowLeft size={14} />
          <span>Ролі платформи</span>
        </Link>
        <span className={styles.breadcrumbDivider}>/</span>
        <span className={styles.breadcrumbCurrent}>{config.title}</span>
      </nav>

      <section className={styles.hero}>
        <article className={styles.heroMain}>
          <span className={`mono ${styles.badge}`}>{config.badge}</span>
          <h1 className={`display ${styles.heroTitle}`}>{config.title}</h1>
          <p className={styles.heroDescription}>{config.description}</p>
          <p className={styles.heroAudience}>{config.audience}</p>

          <div className={styles.actions}>
            <Link href={config.primaryAction.href} className="btn btn-primary">
              {config.primaryAction.label}
            </Link>
            <Link
              href={config.secondaryAction.href}
              className="btn btn-outline"
            >
              {config.secondaryAction.label}
            </Link>
          </div>

          <div className={styles.metricGrid}>
            {config.metrics.map((metric) => (
              <div key={metric.label} className={styles.metricCard}>
                <strong className={`mono ${styles.metricValue}`}>
                  {metric.value}
                </strong>
                <span className={styles.metricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className={styles.heroAside}>
          <div className={styles.heroAsideIconWrap}>
            <Icon size={36} />
          </div>
          <div className={styles.heroAsideCopy}>
            <span className={`mono ${styles.eyebrow}`}>Контур ролі</span>
            <h2 className={`display ${styles.heroAsideTitle}`}>
              Що відкриває ця роль
            </h2>
          </div>

          <ul className={styles.highlightList}>
            {config.highlights.map((item) => (
              <li key={item} className={styles.highlightItem}>
                <CheckCircle2 size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className={styles.featureGrid}>
        {config.featureCards.map(({ title, body, Icon: FeatureIcon }) => (
          <article key={title} className={styles.featureCard}>
            <span className={styles.featureIconWrap}>
              <FeatureIcon size={24} />
            </span>
            <h2 className={`display ${styles.sectionCardTitle}`}>{title}</h2>
            <p className={styles.sectionCardBody}>{body}</p>
          </article>
        ))}
      </section>

      <section className={styles.dualGrid}>
        <article className={styles.workflowPanel}>
          <div className={styles.panelHead}>
            <div>
              <span className={`mono ${styles.eyebrow}`}>Workflow</span>
              <h2 className={`display ${styles.panelTitle}`}>
                {config.workflowTitle}
              </h2>
              <p className={styles.panelDescription}>
                {config.workflowDescription}
              </p>
            </div>
          </div>

          <div className={styles.workflowList}>
            {config.workflowSteps.map((step, index) => (
              <div key={step.title} className={styles.workflowItem}>
                <div className={styles.workflowMarkerWrap}>
                  <span className={styles.workflowMarker}>{index + 1}</span>
                  {index < config.workflowSteps.length - 1 ? (
                    <span className={styles.workflowLine} aria-hidden="true" />
                  ) : null}
                </div>
                <div className={styles.workflowCopy}>
                  <h3 className={styles.workflowTitle}>{step.title}</h3>
                  <p className={styles.workflowBody}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.modulesPanel}>
          <div className={styles.panelHead}>
            <div>
              <span className={`mono ${styles.eyebrow}`}>Modules</span>
              <h2 className={`display ${styles.panelTitle}`}>
                {config.modulesTitle}
              </h2>
              <p className={styles.panelDescription}>
                {config.modulesDescription}
              </p>
            </div>
          </div>

          <div className={styles.moduleList}>
            {config.modules.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className={styles.moduleCard}
              >
                <span className={styles.moduleIconWrap}>
                  <module.Icon size={20} />
                </span>
                <div className={styles.moduleCopy}>
                  <strong className={styles.moduleTitle}>{module.title}</strong>
                  <p className={styles.moduleBody}>{module.body}</p>
                  <span className={styles.moduleLinkLabel}>
                    {module.label}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.accessGrid}>
        <article className={styles.accessPanel}>
          <div className={styles.accessHead}>
            <span className={styles.accessIconOk}>
              <CheckCircle2 size={18} />
            </span>
            <div>
              <h2 className={`display ${styles.accessTitle}`}>
                {config.allowedTitle}
              </h2>
            </div>
          </div>

          <ul className={styles.accessList}>
            {config.allowedItems.map((item) => (
              <li key={item} className={styles.accessItem}>
                <CheckCircle2 size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.accessPanel}>
          <div className={styles.accessHead}>
            <span className={styles.accessIconSoft}>
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className={`display ${styles.accessTitle}`}>
                {config.restrictedTitle}
              </h2>
            </div>
          </div>

          <ul className={styles.accessList}>
            {config.restrictedItems.map((item) => (
              <li key={item} className={styles.accessItem}>
                <MoveRight size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {nextStep ? (
        <section className={styles.nextPanel}>
          <div className={styles.nextCopy}>
            <span className={`mono ${styles.eyebrow}`}>Next Role</span>
            <h2 className={`display ${styles.nextTitle}`}>{nextStep.title}</h2>
            <p className={styles.nextBody}>{nextStep.body}</p>
          </div>
          <div className={styles.nextActions}>
            <Link href={nextStep.href} className="btn btn-outline">
              {nextStep.buttonLabel}
            </Link>
          </div>
        </section>
      ) : null}

      <section className={styles.footerPanel}>
        <div className={styles.footerIconWrap}>
          <ScalesIcon size={56} className={styles.footerIcon} />
        </div>

        <div className={styles.footerCopy}>
          <h2 className={`display ${styles.footerTitle}`}>
            {config.footerTitle}
          </h2>
          <p className={styles.footerBody}>{config.footerBody}</p>
        </div>

        <div className={styles.footerActions}>
          <Link href={config.primaryAction.href} className="btn btn-primary">
            {config.primaryAction.label}
          </Link>
          <Link href={ROUTES.rolesDashboard} className="btn btn-outline">
            До всіх ролей
          </Link>
        </div>
      </section>
    </section>
  );
}
