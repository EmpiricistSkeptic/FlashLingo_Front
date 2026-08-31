export const LANGUAGE_OPTIONS = [
  { code: "ru", label: "Russian", speechLocale: "ru-RU" },
  { code: "en", label: "English", speechLocale: "en-US" },
  { code: "es", label: "Spanish", speechLocale: "es-ES" },
  { code: "fr", label: "French", speechLocale: "fr-FR" },
  { code: "de", label: "German", speechLocale: "de-DE" },
  { code: "it", label: "Italian", speechLocale: "it-IT" },
  { code: "pt", label: "Portuguese", speechLocale: "pt-PT" },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

export function languageLabel(code: string): string {
  return (
    LANGUAGE_OPTIONS.find((option) => option.code === code)?.label ?? code
  );
}

export function speechLocale(code: LanguageCode): string {
  return (
    LANGUAGE_OPTIONS.find((option) => option.code === code)?.speechLocale ??
    "en-US"
  );
}