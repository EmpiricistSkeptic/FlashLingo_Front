export const LANGUAGE_OPTIONS = [
  { code: "ru", label: "Russian", speechLocale: "ru-RU", flag: "🇷🇺" },
  { code: "en", label: "English", speechLocale: "en-US", flag: "🇬🇧" },
  { code: "es", label: "Spanish", speechLocale: "es-ES", flag: "🇪🇸" },
  { code: "fr", label: "French", speechLocale: "fr-FR", flag: "🇫🇷" },
  { code: "de", label: "German", speechLocale: "de-DE", flag: "🇩🇪" },
  { code: "it", label: "Italian", speechLocale: "it-IT", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", speechLocale: "pt-PT", flag: "🇵🇹" },
  { code: "id", label: "Indonesian", speechLocale: "id-ID", flag: "🇮🇩" },
  { code: "ja", label: "Japanese", speechLocale: "ja-JP", flag: "🇯🇵" },
  { code: "ko", label: "Korean", speechLocale: "ko-KR", flag: "🇰🇷" },
  { code: "zh", label: "Chinese", speechLocale: "zh-CN", flag: "🇨🇳" },
  { code: "nl", label: "Dutch", speechLocale: "nl-NL", flag: "🇳🇱" },
  { code: "pl", label: "Polish", speechLocale: "pl-PL", flag: "🇵🇱" },
  { code: "sv", label: "Swedish", speechLocale: "sv-SE", flag: "🇸🇪" },
  { code: "no", label: "Norwegian", speechLocale: "nb-NO", flag: "🇳🇴" },
  { code: "da", label: "Danish", speechLocale: "da-DK", flag: "🇩🇰" },
  { code: "fi", label: "Finnish", speechLocale: "fi-FI", flag: "🇫🇮" },
  { code: "el", label: "Greek", speechLocale: "el-GR", flag: "🇬🇷" },
  { code: "tr", label: "Turkish", speechLocale: "tr-TR", flag: "🇹🇷" },
  { code: "uk", label: "Ukrainian", speechLocale: "uk-UA", flag: "🇺🇦" },
  { code: "ro", label: "Romanian", speechLocale: "ro-RO", flag: "🇷🇴" },
  { code: "cs", label: "Czech", speechLocale: "cs-CZ", flag: "🇨🇿" },
  { code: "hu", label: "Hungarian", speechLocale: "hu-HU", flag: "🇭🇺" },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

export function languageLabel(code: string): string {
  return (
    LANGUAGE_OPTIONS.find((option) => option.code === code)?.label ?? code
  );
}

export function languageFlag(code: string): string {
  return (
    LANGUAGE_OPTIONS.find((option) => option.code === code)?.flag ?? "🏳️"
  );
}

export function speechLocale(code: LanguageCode): string {
  return (
    LANGUAGE_OPTIONS.find((option) => option.code === code)?.speechLocale ??
    "en-US"
  );
}