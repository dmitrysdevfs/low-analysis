"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import { useNotes } from "@/hooks/useNotes";
import { notify } from "@/lib/toast";
import { formatDateShort } from "@/lib/utils";
import styles from "./ClientWorkspace.module.scss";

export function ClientWorkspaceNotes() {
  const { user } = useAuth();
  const { notes, addNote, removeNote, togglePin } = useNotes();
  const [text, setText] = useState("");

  const orderedNotes = useMemo(
    () =>
      [...notes].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      }),
    [notes],
  );

  if (!user) return null;

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (text.trim().length < 10) {
      notify.warning("Нотатка має містити щонайменше 10 символів.");
      return;
    }
    addNote({ type: "manual", color: "gold", noteText: text.trim() });
    setText("");
    notify.success("Нотатку збережено.");
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Нотатки кабінету</span>
          <h1 className={styles.title}>Особистий дослідницький блокнот</h1>
          <p className={styles.description}>
            Фіксуйте інтерпретації, відкриті питання та завдання під час роботи
            з Low Analysis.
          </p>
        </div>

        <div className={styles.heroMeta}>
          <div className={styles.heroIdentity}>
            <span className={styles.rolePill}>Дошка нотаток</span>
            <div className={styles.identityName}>
              {notes.length} активних нотаток
            </div>
            <div className={styles.identityEmail}>
              Організовано для {user.displayName}
            </div>
          </div>

          <div className={styles.heroActions}>
            <Link href={ROUTES.account} className={styles.heroLink}>
              Повернутися до кабінету
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.panelGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Створити</span>
              <h2 className={styles.panelTitle}>Нова нотатка</h2>
            </div>
          </div>

          <form className={styles.fieldGrid} onSubmit={handleCreate}>
            <label className={styles.textareaField}>
              <span className={styles.label}>Текст нотатки</span>
              <textarea
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>

            <div className={styles.actionRow}>
              <button type="submit" className={styles.primaryButton}>
                Зберегти нотатку
              </button>
            </div>
          </form>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Підказки</span>
              <h2 className={styles.panelTitle}>
                Рекомендована структура нотатки
              </h2>
            </div>
          </div>

          <div className={styles.statusList}>
            <div className={styles.statusRow}>
              <div className={styles.statusLabel}>Питання</div>
              <div className={styles.statusMeta}>
                Яку правову неоднозначність або граничний випадок ви
                досліджуєте?
              </div>
            </div>
            <div className={styles.statusRow}>
              <div className={styles.statusLabel}>Посилання</div>
              <div className={styles.statusMeta}>
                Який закон, стаття або суб&apos;єкт спричинили цю нотатку?
              </div>
            </div>
            <div className={styles.statusRow}>
              <div className={styles.statusLabel}>Дія</div>
              <div className={styles.statusMeta}>
                Що потрібно перевірити, порівняти або зберегти далі?
              </div>
            </div>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Блокнот</span>
              <h2 className={styles.panelTitle}>Збережені нотатки</h2>
            </div>
          </div>

          {orderedNotes.length > 0 ? (
            <div className={styles.noteList}>
              {orderedNotes.map((note) => (
                <div key={note.id} className={styles.noteCard}>
                  <div className={styles.noteTopRow}>
                    <div>
                      <div className={styles.noteTitle}>
                        {note.type === "article"
                          ? `Ст. ${note.articleNum}${note.articleTitle ? ` — ${note.articleTitle}` : ""}`
                          : note.type === "selection" && note.selectedText
                            ? note.selectedText.slice(0, 60)
                            : (note.noteText.slice(0, 60) ?? "Нотатка")}
                      </div>
                      <div className={styles.noteMeta}>
                        Оновлено {formatDateShort(note.updatedAt)}
                      </div>
                    </div>

                    {note.pinned ? (
                      <span className={styles.badgeAccent}>Закріплено</span>
                    ) : (
                      <span className={styles.badge}>Чернетка</span>
                    )}
                  </div>

                  {note.noteText ? (
                    <div className={styles.noteBody}>{note.noteText}</div>
                  ) : null}

                  <div className={styles.noteActions}>
                    <button
                      type="button"
                      className={styles.miniButton}
                      onClick={() => togglePin(note.id)}
                    >
                      {note.pinned ? "Відкріпити" : "Закріпити"}
                    </button>
                    <button
                      type="button"
                      className={styles.miniButton}
                      onClick={() => removeNote(note.id)}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              Блокнот порожній. Створіть першу нотатку для фіксації правового
              дослідження.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
