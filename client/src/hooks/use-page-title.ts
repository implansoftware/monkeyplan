import { useEffect } from "react";

const BASE_TITLE = "MonkeyPlan";

export function usePageTitle(title?: string) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${BASE_TITLE}`;
    } else {
      document.title = `${BASE_TITLE} - Gestionale per Assistenza Tecnica, Retail Telefonia e Rivendita Usato`;
    }
    return () => {
      document.title = `${BASE_TITLE} - Gestionale per Assistenza Tecnica, Retail Telefonia e Rivendita Usato`;
    };
  }, [title]);
}
