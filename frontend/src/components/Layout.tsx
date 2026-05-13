import type { ReactNode } from 'react';
import styles from './Layout.module.scss';

export function Layout({
  children,
  fullHeight = false,
}: {
  children: ReactNode;
  fullHeight?: boolean;
}) {
  return (
    <div className={`${styles.layout} ${fullHeight ? styles.layoutFullHeight : ''}`}>
      {children}
    </div>
  );
}
