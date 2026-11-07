# Slidekick

An Angular 22 game. Use `nvm use` to select the Node version in `.nvmrc`, then install dependencies with `npm ci`.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to build the project. Generated artifacts are stored in the ignored `docs/` directory.

## Yandex Games build

Run `npm run build:yandex` to create a separate production package in `dist/yandex/browser/`.
Upload the contents of that directory as a ZIP with `index.html` at the archive root to the Yandex Games developer console. The build uses relative asset URLs and does not require a Node server.

Only this build includes the Yandex adapter and loads `/sdk.js`, which the Yandex hosting environment supplies. Standard web and GitHub Pages builds use the default platform adapter with no SDK requests or ads. For local testing, the game continues without ads if the SDK cannot load; use the Yandex console draft/debug preview to verify real SDK behavior.

The game calls Game Ready after rendering, reports gameplay start/stop around panels and pauses, and requests a fullscreen interstitial when the player confirms a new game. Input is blocked until the ad closes or reports an error/offline/unavailable result. No ads are requested on initial load or during a move. Enable monetisation in the Yandex developer console; the platform controls ad availability and frequency. Rewarded ads and purchases are not enabled.

Platform capabilities live in `src/app/platform/game-platform.ts`. Each portal gets its own adapter and build configuration replacing `platform.providers.ts`; game components depend on the shared interface rather than portal SDK APIs.

## Running unit tests

Run `npm test -- --watch=false` to execute the unit tests with Vitest.

## Automatic deployment

`.github/workflows/pages.yml` checks test types, runs tests, and builds the site on pull requests and pushes to `main`. Only successful builds on `main` deploy to https://andreytimoshenkov.github.io/512/. The workflow can also be run manually from the Actions tab.

GitHub Pages must use **GitHub Actions** as its publishing source (Settings → Pages → Build and deployment). No personal access token is required; deployment uses the workflow's `GITHUB_TOKEN`.

`npm run build:pages` builds with the `/512/` base URL and prepares the browser entry point and a `404.html` fallback. Only `docs/browser` is uploaded; GitHub Pages hosts static files and does not run the Node SSR server. Generated files do not need to be committed or pushed to `gh-pages`.

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
