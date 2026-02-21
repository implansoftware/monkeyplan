import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonIT from "./locales/it/common.json";
import commonEN from "./locales/en/common.json";
import commonFR from "./locales/fr/common.json";
import commonES from "./locales/es/common.json";
import commonDE from "./locales/de/common.json";
import commonZH from "./locales/zh/common.json";
import commonNL from "./locales/nl/common.json";
import commonAR from "./locales/ar/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { common: commonIT },
      en: { common: commonEN },
      fr: { common: commonFR },
      es: { common: commonES },
      de: { common: commonDE },
      zh: { common: commonZH },
      nl: { common: commonNL },
      ar: { common: commonAR },
    },
    fallbackLng: "it",
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "monkeyplan-lang",
    },
  });

export default i18n;
