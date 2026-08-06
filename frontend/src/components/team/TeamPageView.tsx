"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Clock3 } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import {
  teamMembers,
  teamTracks,
  type TeamTrack,
} from "@/constants/teamMembers";
import styles from "./TeamPageView.module.scss";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i, 8) * 0.06,
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

const TRACK_LABEL: Record<TeamTrack, string> = {
  product: "Продукт",
  design: "Дизайн",
  fullstack: "Fullstack",
  backend: "Backend",
  quality: "Якість",
  legal: "Право",
};

export function TeamPageView() {
  const [track, setTrack] = useState<TeamTrack | "all">("all");

  const stats = useMemo(() => {
    const years = teamMembers.reduce((sum, m) => sum + m.years, 0);
    const tracks = new Set(teamMembers.map((m) => m.track));
    const tech = new Set(teamMembers.flatMap((m) => m.stack));
    return {
      people: teamMembers.length,
      years,
      tracks: tracks.size,
      tech: tech.size,
    };
  }, []);

  const visible = useMemo(
    () =>
      track === "all"
        ? teamMembers
        : teamMembers.filter((m) => m.track === track),
    [track],
  );

  return (
    <div className={styles.page}>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className={`section ${styles.hero}`}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={styles.heroInner}
          >
            <span className="eyebrow">Склад проєкту · 2026</span>

            <h1 className={`title ${styles.h1}`}>
              Команда <span className={styles.h1Accent}>проєкту</span>
            </h1>

            <p className={styles.heroText}>
              Над Law Analysis працює міждисциплінарна команда: продукт, дизайн,
              інженерія, якість та юридична експертиза. Кожен напрям відповідає
              за свою частину реєстру суб&apos;єктів і норм законодавства
              України.
            </p>

            <div className={styles.statsRow}>
              {[
                { value: stats.people, label: "учасників" },
                { value: stats.tracks, label: "напрямів" },
                { value: stats.years, label: "років досвіду" },
                { value: stats.tech, label: "навичок" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  className={styles.stat}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.07, duration: 0.4 }}
                >
                  <span className={`mono ${styles.statValue}`}>{s.value}</span>
                  <span className={`mono ${styles.statLabel}`}>{s.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Registry ───────────────────────────────────────────── */}
      <section className={`sectionLast ${styles.registry}`}>
        <div className="container">
          <div className={styles.registryHead}>
            <div>
              <div className={`mono ${styles.sectionNum}`}>01 —</div>
              <h2 className={`titleH2 ${styles.h2}`}>Реєстр учасників</h2>
            </div>

            <div className={styles.filters} role="tablist" aria-label="Напрями">
              {teamTracks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={track === t.id}
                  onClick={() => setTrack(t.id)}
                  className={`mono ${styles.filter} ${
                    track === t.id ? styles.filterActive : ""
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grid}>
            {visible.map((member, index) => (
              <motion.article
                key={member.id}
                className={styles.card}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.08 }}
                variants={fadeUp}
              >
                <div className={styles.cardGlow} aria-hidden="true" />

                <div className={styles.photoWrap}>
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                    className={styles.photo}
                    style={
                      {
                        objectPosition: member.photoPosition,
                        "--photo-brightness": member.photoBrightness,
                        "--photo-grayscale": member.photoGrayscale,
                      } as React.CSSProperties
                    }
                  />
                  <div className={styles.photoVeil} aria-hidden="true" />
                  <span className={styles.cornerTL} aria-hidden="true" />
                  <span className={styles.cornerBR} aria-hidden="true" />
                  <span className={`mono ${styles.index}`}>
                    № {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={`mono ${styles.trackChip}`}>
                    {TRACK_LABEL[member.track]}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={`display ${styles.name}`}>{member.name}</h3>
                  <p className={`mono ${styles.role}`}>{member.role}</p>

                  {member.note && <p className={styles.note}>{member.note}</p>}

                  <ul className={styles.stack}>
                    {member.stack.map((tech) => (
                      <li key={tech} className={`mono ${styles.tech}`}>
                        {tech}
                      </li>
                    ))}
                  </ul>

                  <div className={styles.cardFoot}>
                    <Clock3 size={13} className={styles.footIcon} />
                    <span className={`mono ${styles.years}`}>
                      {member.yearsLabel}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className={`sectionLast ${styles.ctaSection}`}>
        <div className="container">
          <motion.div
            className={styles.cta}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.ctaGlow} aria-hidden="true" />
            <div className={styles.ctaText}>
              <div className={`mono ${styles.ctaKicker}`}>§ Спільна мета</div>
              <h2 className={`titleH2 ${styles.ctaTitle}`}>
                Робимо законодавство зрозумілим
              </h2>
              <p className={styles.ctaDesc}>
                Від структурування норм до AI-аналітики — команда працює над
                тим, щоб доступ до права був відкритим для кожного.
              </p>
            </div>

            <div className={styles.ctaActions}>
              <Link href={ROUTES.projectInfo} className="btn btn-primary">
                Про проєкт
                <ArrowRight size={15} />
              </Link>
              <Link href={ROUTES.roadmap} className="btn btn-outline">
                Дорожня карта
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
