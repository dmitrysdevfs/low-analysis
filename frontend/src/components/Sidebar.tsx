import { useSubjects } from "@/hooks/useSubjects";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export interface SidebarSubject {
  _id: string;
  canonical_name: string;
}

interface SidebarProps {
  subjectsList?: SidebarSubject[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  isLoading?: boolean;
}

export default function Sidebar({
  subjectsList,
  selectedId,
  onSelect,
  isLoading,
}: SidebarProps = {}) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const {
    subjects: fetchedSubjects,
    loading: fetchLoading,
    error: fetchError,
  } = useSubjects();

  const subjects = subjectsList ?? fetchedSubjects;
  const loading = isLoading ?? (subjectsList ? false : fetchLoading);
  const error = subjectsList ? null : fetchError;

  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) =>
      a.canonical_name.localeCompare(b.canonical_name, "uk"),
    );
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    const value = search.toLowerCase();

    return sortedSubjects.filter((subject) => {
      const name = subject.canonical_name.toLowerCase();
      return name.includes(value);
    });
  }, [search, sortedSubjects]);

  const visibleSubjects =
    search.length > 0
      ? filteredSubjects
      : showAll
        ? sortedSubjects
        : sortedSubjects.slice(0, 10);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="font-semibold text-[#c8a843]">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  if (loading) {
    return (
      <aside className="sticky top-[120px] self-start w-full sm:max-w-80 pl-10 pt-10">
        <div className="text-sm text-gray-400 animate-pulse">
          Завантаження...
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="sticky top-[120px] self-start w-full sm:max-w-80 pl-10 pt-10">
        <div className="text-sm text-red-500">
          Сталась помилка при завантаженні даних
        </div>
      </aside>
    );
  }

  return (
<<<<<<< HEAD
    <aside className="top-6 w-full sm:max-w-70 lg:max-w-80 shrink-0 lg:pt-18 md:pt-14 pt-10 lg:pl-10 md:pl-8 pl-6 pr-6 sm:pr-1">
=======
    <aside className="sticky top-[120px] self-start w-full sm:max-w-70 lg:max-w-80 shrink-0 lg:pt-18 md:pt-14 pt-10 lg:pl-10 md:pl-8 pl-6 pr-6 sm:pr-1">
>>>>>>> develop
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 font-mono text-[0.8rem] text-[#4a80d4] pointer-events-none">
            ⌕
          </span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук..."
            className="w-full bg-[#080f20] border border-[#1c3260] rounded-[8px] py-[7px] pr-[12px] pl-[38px] text-white text-[0.86rem] font-inherit outline-none appearance-none box-border transition-[border-color,box-shadow] duration-[0.18s] ease-in-out placeholder-[#4a5e7a] hover:not-focus:border-[#4a80d4]/45 focus:border-[#c8a843]/60 focus:shadow-[0_0_0_3px_rgba(200,168,67,0.12)] truncate"
          />

          {search && (
            <button
              onClick={() => {
                setSearch("");
                if (onSelect) onSelect(null);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </motion.div>
      </div>

      <div className="mt-5 flex flex-col  pr-2">
        <div className="max-h-[500px] overflow-y-auto">
          <ul>
            {visibleSubjects.map((subject) => (
              <li
                key={subject._id}
                onClick={() => {
                  if (onSelect) {
                    if (selectedId === subject._id) {
                      onSelect(null);
                      setSearch("");
                    } else {
                      onSelect(subject._id);
                      setSearch(subject.canonical_name);
                    }
                  } else {
                    setSearch(subject.canonical_name);
                  }
                }}
                className={`cursor-pointer text-sm leading-5 rounded px-1 py-2 ${
                  selectedId === subject._id
                    ? "text-[#c8a843] bg-[#1c3260]"
                    : "text-[#7a98c0] hover:text-[#c8a843] hover:bg-[#1c3260]"
                }`}
              >
                {highlightMatch(subject.canonical_name, search)}
              </li>
            ))}
          </ul>
          {search.length > 0 && filteredSubjects.length === 0 && (
            <p className="mt-4 text-sm text-neutral-500">Нічого не знайдено</p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="flex btn-outline">
            {visibleSubjects.length}/{subjects.length}
          </span>
          {subjects.length > 10 && search.length === 0 && (
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="btn btn-outline"
            >
              {showAll ? "Сховати" : "Показати всіх"}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
