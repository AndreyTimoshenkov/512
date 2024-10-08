export enum ESupportedLocale {
  EN = 'en-UK',
  FR = 'fr-FR',
  RU = 'ru-RU',
  TR = 'tr-TR',
}

export type TCodes = keyof typeof ESupportedLocale;