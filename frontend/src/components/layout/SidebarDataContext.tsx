"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export interface SidebarSubjectItem {
  id: string;
  name: string;
  role?: string;
  count?: number;
}

interface SidebarDataContextValue {
  subjects: SidebarSubjectItem[];
  setSubjects: (subjects: SidebarSubjectItem[]) => void;
  onSubjectSelect: ((id: string | null) => void) | null;
  setOnSubjectSelect: (fn: ((id: string | null) => void) | null) => void;
  activeSubjectId: string | null;
  setActiveSubjectId: (id: string | null) => void;
}

const SidebarDataContext = createContext<SidebarDataContextValue>({
  subjects: [],
  setSubjects: () => {},
  onSubjectSelect: null,
  setOnSubjectSelect: () => {},
  activeSubjectId: null,
  setActiveSubjectId: () => {},
});

export function SidebarDataProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjectsState] = useState<SidebarSubjectItem[]>([]);
  const setSubjects = useCallback(
    (s: SidebarSubjectItem[]) => setSubjectsState(s),
    [],
  );

  const [onSubjectSelect, setOnSubjectSelectState] = useState<
    ((id: string | null) => void) | null
  >(null);
  const setOnSubjectSelect = useCallback(
    (fn: ((id: string | null) => void) | null) => setOnSubjectSelectState(() => fn),
    [],
  );

  const [activeSubjectId, setActiveSubjectIdState] = useState<string | null>(null);
  const setActiveSubjectId = useCallback(
    (id: string | null) => setActiveSubjectIdState(id),
    [],
  );

  return (
    <SidebarDataContext.Provider
      value={{ subjects, setSubjects, onSubjectSelect, setOnSubjectSelect, activeSubjectId, setActiveSubjectId }}
    >
      {children}
    </SidebarDataContext.Provider>
  );
}

export function useSidebarData() {
  return useContext(SidebarDataContext);
}
