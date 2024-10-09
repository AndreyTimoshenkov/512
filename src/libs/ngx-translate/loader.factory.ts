import { HttpClient } from "@angular/common/http";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  // return new TranslateHttpLoader(http, './public/i18n/', '.json');
  return new TranslateHttpLoader(http, './public/i18n/', '.json');
}