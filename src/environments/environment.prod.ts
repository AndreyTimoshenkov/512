import { ESupportedLocale } from "../app/components/locale-switcher/locale.types";
import { IEnvironment } from "./environment.interface";

export const environment: IEnvironment = {
  production: true,
  locale: ESupportedLocale.EN,
};