import { FactoryProvider, InjectionToken } from "@angular/core";
import { BehaviorSubject, distinctUntilChanged, Observable, switchMap } from "rxjs";
import { TCodes } from "../app/components/locale-switcher/locale.types";
import { I18nCore } from "./i18n.interface";

export const I18N_CORE = new InjectionToken<Observable<I18nCore>>('I18N_CORE');

export const localeSubject = new BehaviorSubject<TCodes>('EN');

export type Ti18nFactory<T> = (store: any) => Observable<T>;

export const i18nCoreFactory: Ti18nFactory<I18nCore> = (): Observable<I18nCore> =>
  localeSubject.pipe(
    distinctUntilChanged(),
    switchMap((code: TCodes) =>
      import(`./lang-${code}.lang`)
        .then((l: { lang: I18nCore }) => l.lang)
        .catch(() => import('./lang-RU.lang')
        .then((l: { lang: I18nCore }) => l.lang))
    )
  );

export function updateLocale(code: TCodes) {
  localeSubject.next(code);
}

export const i18nCoreProvider: FactoryProvider = {
  provide: I18N_CORE,
  useFactory: i18nCoreFactory,
};