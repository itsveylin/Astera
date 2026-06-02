import { useEffect } from "react";

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [active]);
}
