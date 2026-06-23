"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchSubjects } from "@/lib/api/subjects";
import styles from "./SubjectAutocomplete.module.scss";

interface SubjectAutocompleteProps {
  subjectId: string;
  subjectName: string;
  onChange: (patch: { subjectId: string; subjectName: string }) => void;
}

const DEBOUNCE_MS = 250;

/**
 * Controlled subject autocomplete. The selected subject lives in the parent
 * form state (subjectId + subjectName), so typing, selecting and form reset
 * stay in sync without local mirroring. A committed selection (subjectId set)
 * disables the dropdown until the user edits the text again.
 */
export function SubjectAutocomplete({
  subjectId,
  subjectName,
  onChange,
}: SubjectAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(subjectName.trim());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebounced(subjectName.trim()),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [subjectName]);

  const enabled = open && !subjectId && debounced.length > 0;

  const { data, isFetching } = useQuery({
    queryKey: ["subject-search", debounced],
    queryFn: ({ signal }) => searchSubjects(debounced, { signal }),
    enabled,
    staleTime: 60_000,
  });
  const results = data ?? [];

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleInput = (value: string) => {
    onChange({ subjectName: value, subjectId: "" });
    setOpen(true);
  };

  const handleSelect = (id: string, name: string) => {
    onChange({ subjectName: name, subjectId: id });
    setOpen(false);
  };

  const handleClear = () => {
    onChange({ subjectName: "", subjectId: "" });
    setOpen(false);
  };

  const showDropdown = enabled;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.inputRow}>
        <input
          type="text"
          value={subjectName}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Почніть вводити назву суб'єкта..."
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="subject-autocomplete-list"
          className={`form-control ${styles.input}`}
        />
        {(subjectName || subjectId) && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearBtn}
            aria-label="Очистити суб'єкта"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id="subject-autocomplete-list"
          role="listbox"
          className={styles.dropdown}
        >
          {isFetching && results.length === 0 && (
            <li className={styles.hint}>Пошук…</li>
          )}
          {!isFetching && results.length === 0 && (
            <li className={styles.hint}>Нічого не знайдено</li>
          )}
          {results.map((s) => (
            <li key={s._id} role="option" aria-selected={false}>
              <button
                type="button"
                // Prevent input blur before the click registers.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s._id, s.name)}
                className={styles.option}
              >
                <span className={styles.optName}>{s.name}</span>
                <span className={styles.optCount}>{s.count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
