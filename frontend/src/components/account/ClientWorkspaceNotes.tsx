"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import {
  deleteWorkspaceNote,
  readClientWorkspace,
  toggleWorkspaceNotePin,
  upsertWorkspaceNote,
  type ClientWorkspace,
} from "@/lib/auth/clientWorkspace";
import { notify } from "@/lib/toast";
import { formatDateShort } from "@/lib/utils";
import styles from "./ClientWorkspace.module.scss";

export function ClientWorkspaceNotes() {
  const { user } = useAuth();
  const userId = user?.id;
  const [workspace, setWorkspace] = useState<ClientWorkspace | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!userId) {
      return;
    }

    setWorkspace(readClientWorkspace(userId));
  }, [userId]);

  const orderedNotes = useMemo(() => {
    if (!workspace) {
      return [];
    }

    return [...workspace.notes].sort((left, right) => {
      if (left.pinned !== right.pinned) {
        return left.pinned ? -1 : 1;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });
  }, [workspace]);

  if (!user || !workspace) {
    return null;
  }

  function handleCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      return;
    }

    if (title.trim().length < 3 || body.trim().length < 10) {
      notify.warning("Додайте заголовок та текст нотатки перед збереженням.");
      return;
    }

    const nextWorkspace = upsertWorkspaceNote(userId, {
      title,
      body,
    });

    setWorkspace(nextWorkspace);
    setTitle("");
    setBody("");
    notify.success("Нотатку збережено до кабінету.");
  }

  function handleDelete(noteId: string) {
    if (!userId) {
      return;
    }

    const nextWorkspace = deleteWorkspaceNote(userId, noteId);
    setWorkspace(nextWorkspace);
    notify.info("Нотатку видалено з кабінету.");
  }

  function handlePin(noteId: string) {
    if (!userId) {
      return;
    }

    const nextWorkspace = toggleWorkspaceNotePin(userId, noteId);
    setWorkspace(nextWorkspace);
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
              {workspace.notes.length} активних нотаток
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

          <form className={styles.fieldGrid} onSubmit={handleCreateNote}>
            <label className={styles.field}>
              <span className={styles.label}>Заголовок</span>
              <input
                className={styles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className={styles.textareaField}>
              <span className={styles.label}>Текст</span>
              <textarea
                className={styles.textarea}
                value={body}
                onChange={(event) => setBody(event.target.value)}
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
                Який закон, стаття або суб'єкт спричинили цю нотатку?
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
                      <div className={styles.noteTitle}>{note.title}</div>
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

                  <div className={styles.noteBody}>{note.body}</div>

                  <div className={styles.noteActions}>
                    <button
                      type="button"
                      className={styles.miniButton}
                      onClick={() => handlePin(note.id)}
                    >
                      {note.pinned ? "Відкріпити" : "Закріпити"}
                    </button>
                    <button
                      type="button"
                      className={styles.miniButton}
                      onClick={() => handleDelete(note.id)}
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
