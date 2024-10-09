import { ESupportedLocale } from "../app/components/locale-switcher/locale.types";

export interface IEnvironment {
  production: boolean,
  locale: ESupportedLocale,
};
