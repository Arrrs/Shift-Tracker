import { useLanguage } from "./language-context";
import { translations, TranslationKey } from "./translations";

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: TranslationKey): string => {
    return translations[language][key];
  };

  return { t, language };
}
