import { LOCAL_MODE } from "../../config/adminConfig";
import { useSubjectsLocal } from "../local/useSubjectsLocal";

type AdminSubjectsResult = ReturnType<typeof useSubjectsLocal>;

export function useAdminSubjects(): AdminSubjectsResult {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (LOCAL_MODE) return useSubjectsLocal();
  // ⚠️ НЕ ВИДАЛЯТИ: серверна реалізація буде тут
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSubjectsLocal(); // fallback until server impl
}
