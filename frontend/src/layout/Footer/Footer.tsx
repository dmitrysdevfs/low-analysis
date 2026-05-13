import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.text}>Low Analysis · Система аналізу законодавства України</span>
      <a href="/api-docs" className={styles.link}>
        Документація API
      </a>
    </footer>
  );
}
