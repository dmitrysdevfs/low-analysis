"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ROUTES } from "@/constants/routes";
import styles from "./page.module.scss";

const LAST_UPDATED = "17 травня 2026 р.";

export default function LegalPage() {
  return (
    <Layout>
      <div className={styles.page}>
        <motion.div
          className={styles.inner}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.hero}>
            <span className={`mono ${styles.eyebrow}`}>Правова інформація</span>
            <h1 className={`display ${styles.title}`}>
              Умови та конфіденційність
            </h1>
            <p className={`mono ${styles.meta}`}>
              Останнє оновлення: {LAST_UPDATED}
            </p>
            <p
              className={`mono ${styles.meta}`}
              style={{
                color: "goldenrod",
                fontSize: "0.8rem",
                marginTop: "0.5rem",
              }}
            >
              ⚠️ Платформа працює в демонстраційному режимі. Авторизація
              реалізована на рівні браузера (localStorage).
            </p>
          </div>

          <nav className={styles.toc}>
            <a href="#terms" className={`mono ${styles.tocLink}`}>
              → Умови використання
            </a>
            <a href="#privacy" className={`mono ${styles.tocLink}`}>
              → Політика конфіденційності
            </a>
          </nav>

          {/* TERMS */}
          <section id="terms" className={styles.section}>
            <h2 className={`display ${styles.sectionTitle}`}>
              Умови використання
            </h2>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>1. Загальні положення</h3>
              <p>
                Law Analysis — відкрита інформаційно-аналітична платформа для
                структурування, пошуку та дослідження законодавства України.
                Використовуючи платформу, ви погоджуєтесь з цими умовами.
              </p>
              <p>
                Платформа надає інформацію виключно в довідкових цілях і не є
                юридичною консультацією. Для вирішення конкретних правових
                питань звертайтесь до кваліфікованого юриста.
              </p>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>2. Реєстрація та акаунт</h3>
              <p>
                Перегляд законів, суб&apos;єктів і пошук доступні без
                реєстрації. Особистий кабінет (нотатки, збережені статті,
                налаштування) потребує створення акаунту.
              </p>
              <p>
                Ви зобов&apos;язані надавати достовірні дані при реєстрації та
                зберігати конфіденційність свого паролю. Передача акаунту третім
                особам заборонена.
              </p>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>3. Допустиме використання</h3>
              <p>Дозволяється:</p>
              <ul className={styles.list}>
                <li>
                  Перегляд, пошук та дослідження законодавства у некомерційних
                  цілях
                </li>
                <li>
                  Використання в навчальних, академічних та аналітичних цілях
                </li>
                <li>
                  Посилання на сторінки платформи у публікаціях та матеріалах
                </li>
              </ul>
              <p>Забороняється:</p>
              <ul className={styles.list}>
                <li>
                  Автоматичний масовий збір даних (скрапінг) без письмового
                  дозволу
                </li>
                <li>Комерційне перепродавання контенту платформи</li>
                <li>Будь-яке використання, що порушує законодавство України</li>
              </ul>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>4. Джерела даних</h3>
              <p>
                Тексти законів отримані з офіційного порталу{" "}
                <a
                  href="https://zakon.rada.gov.ua"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  zakon.rada.gov.ua
                </a>{" "}
                Верховної Ради України. Law Analysis здійснює структурування та
                аналіз цих текстів, не змінюючи їхнього юридичного змісту.
              </p>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>
                5. Відмова від відповідальності
              </h3>
              <p>
                Платформа надається «як є». Ми не гарантуємо абсолютну
                актуальність або повноту представлених законодавчих даних.
                Офіційним джерелом законодавства є Верховна Рада України.
              </p>
            </div>
          </section>

          <div className={styles.divider} />

          {/* PRIVACY */}
          <section id="privacy" className={styles.section}>
            <h2 className={`display ${styles.sectionTitle}`}>
              Політика конфіденційності
            </h2>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>1. Оператор даних</h3>
              <p>
                Оператором персональних даних є команда розробників платформи
                Law Analysis. Обробка даних здійснюється відповідно до{" "}
                <span className={styles.lawRef}>
                  Закону України «Про захист персональних даних» № 2297-VI від
                  01.06.2010
                </span>{" "}
                та Регламенту (ЄС) 2016/679 (GDPR).
              </p>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>2. Які дані ми збираємо</h3>
              <p>При реєстрації та використанні кабінету:</p>
              <ul className={styles.list}>
                <li>
                  <strong>Ім&apos;я відображення</strong> — для персоналізації
                  інтерфейсу
                </li>
                <li>
                  <strong>Email-адреса</strong> — для ідентифікації акаунту
                </li>
                <li>
                  <strong>Пароль</strong> — зберігається локально в браузері
                  (демо-режим)
                </li>
                <li>
                  <strong>Нотатки та збережені статті</strong> — контент
                  особистого кабінету
                </li>
                <li>
                  <strong>Дата останнього входу</strong> — для відображення в
                  кабінеті
                </li>
              </ul>
              <p>
                Платформа не збирає IP-адреси, геолокацію або дані про пристрій
                у маркетингових цілях.
              </p>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>3. Cookies</h3>
              <p>
                Використовуються виключно технічні cookies для підтримки сесії
                авторизованого користувача. Маркетингові або відстежувальні
                cookies не застосовуються.
              </p>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>
                4. Зберігання та захист даних
              </h3>
              <p>
                Платформа є навчально-демонстраційним проектом (educational
                prototype). Дані акаунту зберігаються локально в браузері
                користувача (localStorage) і не передаються на жоден сервер.
                Рекомендується не використовувати реальні паролі. Усі дані
                видаляються при очищенні даних браузера.
              </p>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>5. Ваші права</h3>
              <p>Відповідно до чинного законодавства ви маєте право:</p>
              <ul className={styles.list}>
                <li>Отримати доступ до своїх персональних даних</li>
                <li>Виправити неточні дані у налаштуваннях профілю</li>
                <li>Видалити акаунт і всі пов&apos;язані дані</li>
                <li>Відкликати згоду на обробку даних</li>
              </ul>
            </div>

            <div className={styles.block}>
              <h3 className={styles.blockTitle}>6. Зміни до цієї політики</h3>
              <p>
                У разі суттєвих змін до умов або політики конфіденційності ми
                оновимо дату «Останнє оновлення» у верхній частині цієї
                сторінки. Продовження використання платформи після змін означає
                вашу згоду з оновленими умовами.
              </p>
            </div>
          </section>

          <div className={styles.backRow}>
            <Link href={ROUTES.home} className={`mono ${styles.backLink}`}>
              ← Повернутись на головну
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
