"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export interface SidebarSubjectItem {
  id: string;
  name: string;
  role?: string;
}

interface SidebarDataContextValue {
  subjects: SidebarSubjectItem[];
  setSubjects: (subjects: SidebarSubjectItem[]) => void;
}

const SidebarDataContext = createContext<SidebarDataContextValue>({
  subjects: [],
  setSubjects: () => {},
});

export function SidebarDataProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjectsState] = useState<SidebarSubjectItem[]>([]);
  const setSubjects = useCallback(
    (s: SidebarSubjectItem[]) => setSubjectsState(s),
    [],
  );
  return (
    <SidebarDataContext.Provider value={{ subjects, setSubjects }}>
      {children}
    </SidebarDataContext.Provider>
  );
}

export function useSidebarData() {
  return useContext(SidebarDataContext);
}
