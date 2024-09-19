import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';


export const WINDOW = new InjectionToken<Window>('WindowToken', {
  factory: () => {
    const platformId = inject(PLATFORM_ID);

    return isPlatformBrowser(platformId) ? window : new Window();
  }
});

export const DOCUMENT = new InjectionToken<Document>('DocumentToken', {
  factory: () => {
    const platformId = inject(PLATFORM_ID);

    return isPlatformBrowser(platformId) ? document : new Document();
  }
});