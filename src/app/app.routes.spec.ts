import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';

describe('App routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('accepts the root URL without redirecting', async () => {
    const router = TestBed.inject(Router);
    expect(await router.navigateByUrl('/')).toBeTrue();
    expect(router.url).toBe('/');
    expect(router.routerState.snapshot.root.firstChild?.routeConfig?.redirectTo).toBeUndefined();
  });

  it('redirects unknown URLs to the root', async () => {
    const router = TestBed.inject(Router);
    expect(await router.navigateByUrl('/nonexistent')).toBeTrue();
    expect(router.url).toBe('/');
  });
});
