# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Backend API

The client requests events from `GET /events` and saves event status changes with
`PATCH /events/:eventId/:realityId/status`. Checklist categories and tasks load
from `GET /task-categories` and `GET /task-categories/:categoryId/tasks`.
Adding, deleting, and reordering template tasks is persisted through the task
category API. During development, Vite proxies requests from `/api` to
`http://localhost:8000`, where the backend listens by default. Set
`VITE_API_PROXY_TARGET` if the backend uses another development URL. Set
`VITE_API_BASE_URL` to change the API path/base URL; for production, configure
the web server to proxy that path to the backend.

Run `npm --prefix backend run dev` and `npm --prefix client run dev` in separate
terminals from the repository root. The backend must have its database
environment configured and a reachable PostgreSQL instance. Event status
updates and checklist template changes persist through the API; other editable
event fields are not currently persisted.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
