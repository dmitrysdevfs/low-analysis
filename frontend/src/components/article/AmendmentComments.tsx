"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  useComments,
  useAddComment,
  useDeleteComment,
} from "@/hooks/useComments";
import { notify } from "@/lib/toast";
import type { Comment } from "@/types/legislator";
import styles from "./AmendmentComments.module.scss";

interface AmendmentCommentsProps {
  amendmentId: string;
}

export function AmendmentComments({ amendmentId }: AmendmentCommentsProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");

  const { data: comments, isLoading } = useComments("amendment", amendmentId);
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();

  // Perms check: paid_user, legislator, admin
  const canComment =
    user?.accountType === "admin" ||
    !!user?.roles?.includes("legislator") ||
    !!user?.roles?.includes("paid_user");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (!user) {
      notify.error("Будь ласка, увійдіть, щоб залишати коментарі");
      return;
    }
    if (!canComment) {
      notify.error("Ваш рівень доступу не дозволяє коментувати");
      return;
    }

    try {
      await addCommentMutation.mutateAsync({
        target_type: "amendment",
        target_id: amendmentId,
        text: text.trim(),
      });
      setText("");
      notify.success("Коментар додано");
    } catch {
      notify.error("Не вдалося додати коментар");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm("Ви впевнені, що хочете видалити цей коментар?")) {
      try {
        await deleteCommentMutation.mutateAsync(commentId);
        notify.success("Коментар видалено");
      } catch {
        notify.error("Не вдалося видалити коментар");
      }
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Завантаження коментарів...</div>;
  }

  return (
    <div className={styles.commentsSection}>
      <h4 className={styles.commentsTitle}>
        Обговорення ({comments?.length ?? 0})
      </h4>

      <div className={styles.commentsList}>
        {comments?.map((comment: Comment) => {
          const isCommentOwner =
            user &&
            (comment.created_by?._id === user.id ||
              user.accountType === "admin");

          const authorName = comment.created_by?.fullName ?? "Користувач";

          const formattedDate = new Date(comment.createdAt).toLocaleString(
            "uk-UA",
            {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            },
          );

          return (
            <div key={comment._id} className={styles.commentItem}>
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>{authorName}</span>
                <span className={styles.commentDate}>{formattedDate}</span>
                {isCommentOwner && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className={styles.deleteBtn}
                    disabled={deleteCommentMutation.isPending}
                    title="Видалити коментар"
                  >
                    🗑
                  </button>
                )}
              </div>
              <p className={styles.commentText}>{comment.text}</p>
            </div>
          );
        })}

        {(!comments || comments.length === 0) && (
          <p className={styles.noComments}>
            Коментарів ще немає. Будьте першим!
          </p>
        )}
      </div>

      {user ? (
        canComment ? (
          <form onSubmit={handleSubmit} className={styles.commentForm}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Додати коментар..."
              required
              rows={2}
              className={styles.commentInput}
            />
            <button
              type="submit"
              disabled={addCommentMutation.isPending || !text.trim()}
              className={styles.submitBtn}
            >
              Надіслати
            </button>
          </form>
        ) : (
          <p className={styles.errorText}>
            Тільки авторизовані користувачі з платним доступом чи законотворці
            можуть коментувати.
          </p>
        )
      ) : (
        <p className={styles.errorText}>
          Будь ласка, увійдіть, щоб мати можливість коментувати.
        </p>
      )}
    </div>
  );
}
