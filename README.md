# 512

An Angular 22 game. Use `nvm use` to select the Node version in `.nvmrc`, then install dependencies with `npm ci`.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to build the project. Generated artifacts are stored in the ignored `docs/` directory.

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
