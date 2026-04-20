# Frontend – Project Structure Notes

## Overview

The `frontend/` directory is a **React 19 + TypeScript** single-page application for the **Next PMS** (Project Management System) Frappe app. It is built with **Vite**, styled with **Tailwind CSS v4**, and uses **npm workspaces** to organize code into three internal packages.

The built output is served by Frappe at the route `/next-pms/` (see `ROUTES.base` in `packages/app/src/lib/constant.ts`). The build outputs to `next_pms/public/frontend/`.

---

## Tech Stack

| Area              | Technology                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| Language          | TypeScript (~5.6)                                                          |
| UI Framework      | React 19                                                                   |
| Build Tool        | Vite 6                                                                     |
| CSS               | Tailwind CSS v4 (via `@tailwindcss/vite` plugin)                           |
| Routing           | react-router-dom v6 (createBrowserRouter)                                  |
| State Management  | Redux Toolkit + react-redux (global state); React Context (user, theme)    |
| Forms             | @tanstack/react-form, react-hook-form, zod (validation)                    |
| Tables            | @tanstack/react-table                                                      |
| UI Primitives     | Radix UI, Base UI                                                          |
| Frappe Integration| frappe-react-sdk, @rtcamp/frappe-ui-react (local link)                     |
| Icons             | lucide-react                                                               |
| Linting           | ESLint 9 + typescript-eslint + react-hooks + import ordering               |
| Node Version      | 20 (see `.nvmrc`)                                                          |
| Package Manager   | npm (with workspaces)                                                      |

---

## Workspace Layout

```
frontend/
├── .env / .env.sample        # Vite env vars (VITE_SITE_NAME, VITE_SITE_PORT, etc.)
├── .nvmrc                     # Node 20
├── eslint.config.js           # Shared ESLint config across all packages
├── package.json               # Root workspace – scripts: dev, build, lint
├── tsconfig.json              # Root TS config; references app & hooks packages
├── vite.config.ts             # Shared Vite config used by all packages
└── packages/
    ├── app/                   # @next-pms/app – the main application
    ├── design-system/         # @next-pms/design-system – shared UI components
    └── hooks/                 # @next-pms/hooks – shared Frappe-related hooks
```

### Workspace Package Names

| Directory            | Package Name             | Description                          |
| -------------------- | ------------------------ | ------------------------------------ |
| `packages/app`       | `@next-pms/app`          | Main application (routes, pages, state) |
| `packages/design-system` | `@next-pms/design-system` | Reusable UI components & utilities    |
| `packages/hooks`     | `@next-pms/hooks`        | Reusable Frappe-related React hooks  |

---

## packages/app (`@next-pms/app`)

The main application package. Contains all pages, routing, state management, providers, and app-specific components.

### Entry Points

- **`index.html`** – HTML entry point for Vite.
- **`src/main.tsx`** – React root render. In dev mode, fetches Frappe boot context via API before rendering.
- **`src/app.tsx`** – App root component. Sets up the provider hierarchy:
  `ToastProvider → FrappeProvider → ThemeProvider → UserProvider → Redux Provider → TooltipProvider → Suspense → ErrorFallback → RouterProvider`
- **`src/route.tsx`** – All route definitions using `react-router-dom`. Routes are lazy-loaded. Includes an `AuthenticatedRoute` wrapper that redirects unauthenticated users to `/login`.

### Directory Structure

```
packages/app/src/
├── app.tsx                 # Root App component with provider stack
├── main.tsx                # ReactDOM.createRoot entry
├── route.tsx               # Route definitions (lazy-loaded pages)
├── global.css              # Global styles
├── vite-env.d.ts           # Vite client types
├── components/             # App-specific shared components
│   ├── filters/            # Filter components (approvalStatus, composite, reportsTo)
│   ├── task-log/           # Task log display
│   ├── timesheet-row/      # Timesheet row component
│   ├── infiniteScroll.tsx   # Infinite scroll wrapper
│   ├── taskBadges.tsx       # Task badge display
│   ├── taskPopover.tsx      # Task detail popover
│   ├── taskStatusIndicator.tsx
│   ├── under-construction.tsx
│   └── versionUpdate.tsx    # Version update notification
├── hooks/                  # App-specific hooks
│   ├── useApprovers.ts
│   └── useDebounce.ts
├── layout/                 # App shell layout
│   ├── index.tsx            # Main layout with sidebar
│   ├── header.tsx           # Top header bar
│   └── sidebar/             # Sidebar navigation
├── lib/                    # Utilities & constants
│   ├── constant.ts          # Route paths, roles, custom time values
│   ├── storage.ts           # Local storage helpers
│   └── utils.ts             # General utilities (date, class merging, etc.)
├── pages/                  # Page-level components (one per route)
│   ├── 404.tsx              # Not Found page
│   ├── home/                # Home / dashboard page
│   ├── task/                # Task detail page
│   ├── project/             # Project page
│   ├── timesheet/           # Timesheet pages (personal, team, project sub-routes)
│   ├── allocations/         # Resource allocation pages (team, project)
│   ├── roadmap/             # Roadmap / Gantt page
│   └── report/              # Report page
├── providers/              # React Context providers
│   ├── frappe/              # Frappe SDK provider (frappe-react-sdk)
│   ├── theme/               # Theme context (context, hook, provider, types)
│   └── user/                # User context (auth state, current user)
├── schema/                 # Zod validation schemas
│   ├── project.ts
│   ├── resource.ts
│   ├── task.ts
│   └── timesheet.ts
├── store/                  # Redux Toolkit store
│   ├── index.ts             # Store config (project reducer)
│   ├── project.ts           # Project slice
│   ├── task.ts              # Task slice
│   └── timesheet.ts         # Timesheet slice
└── types/                  # TypeScript type definitions
    ├── index.ts
    ├── resource_management.ts
    ├── task.ts
    ├── team.ts
    └── timesheet.ts
```

### Routes

All routes are nested under the base path `/next-pms`.

| Route Path                  | Component             | Description              |
| --------------------------- | --------------------- | ------------------------ |
| `/`                         | `Home`                | Dashboard / home page    |
| `/task`                     | `Task`                | Task detail view         |
| `/project`                  | `Project`             | Project view             |
| `/timesheet`                | `TimesheetPersonal`   | Personal timesheet       |
| `/timesheet/team`           | `TimesheetTeam`       | Team timesheet           |
| `/timesheet/project`        | `TimesheetProject`    | Project-level timesheet  |
| `/allocations/team`         | `AllocationsTeam`     | Team allocations         |
| `/allocations/project`      | `AllocationsProject`  | Project allocations      |
| `/roadmap`                  | `Roadmap`             | Roadmap view             |
| `/report`                   | `Report`              | Report view              |
| `*`                         | `NotFound`            | 404 page                 |

### Path Alias

`@/*` → `packages/app/src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

---

## packages/design-system (`@next-pms/design-system`)

A shared component library providing reusable, domain-aware UI components. Built on top of **Radix UI** primitives and styled with Tailwind CSS. Uses a `components.json` configuration (shadcn/ui style).

### Exports

The package exposes multiple entry points:

| Import Path                           | Resolves To               | Description                         |
| ------------------------------------- | ------------------------- | ----------------------------------- |
| `@next-pms/design-system`            | `src/index.ts`            | Utility functions + CSS side-effect |
| `@next-pms/design-system/index.css`  | `src/index.css`           | Global design-system styles         |
| `@next-pms/design-system/date`       | `src/utils/date.ts`       | Date utility functions              |
| `@next-pms/design-system/utils`      | `src/utils/index.ts`      | Utility functions (mergeClassNames, debounce, etc.) |
| `@next-pms/design-system/components` | `src/components/index.ts` | All exported UI components          |
| `@next-pms/design-system/hooks`      | `src/hooks.ts`            | Design-system hooks                 |

### Components

```
packages/design-system/src/
├── index.ts               # Package entry (re-exports utils + css)
├── index.css              # Design system global CSS
├── components/
│   ├── index.ts            # Component barrel exports
│   ├── dialog/             # Dialog (Radix-based)
│   ├── dropdown-menu/      # Dropdown menu (Radix-based)
│   ├── durationInput/      # Time duration input
│   ├── error-fallback/     # Error boundary fallback UI
│   ├── globalSearch/       # Global search (cmdk-based)
│   ├── hover-card/         # Hover card (Radix-based)
│   ├── input/              # Text input
│   ├── separator/          # Visual separator
│   ├── spinner/            # Loading spinner
│   ├── table/              # Table components (header, body, row, cell, etc.)
│   ├── task-progress/      # Task progress indicator
│   ├── task-status/        # Task status icons/badges
│   ├── timesheet/          # Timesheet-specific components
│   ├── tooltip/            # Tooltip (Radix-based)
│   └── typography/         # Typography component
└── utils/
    ├── index.ts            # mergeClassNames, debounce, etc.
    └── date.ts             # Date formatting & conversion utilities
```

### Key Dependencies

- `@radix-ui/react-*` (dialog, dropdown-menu, checkbox, popover, select, tabs, toast, tooltip, etc.)
- `@base-ui/react`
- `cmdk` (command palette)
- `react-quill-new` / `react-quill` (rich text editor)
- `react-day-picker` (date picker)
- `lucide-react` (icons)

---

## packages/hooks (`@next-pms/hooks`)

A lightweight package of reusable React hooks focused on Frappe backend integration.

### Exported Hooks

| Hook                         | Purpose                                |
| ---------------------------- | -------------------------------------- |
| `useGetFrappeDoctypeMeta`    | Fetch doctype metadata from Frappe     |
| `useGetFrappeDocTypeCount`   | Fetch document count for a doctype     |
| `usePagination`              | Pagination state management            |
| `useInfiniteScroll`          | Infinite scroll behavior               |
| `useQueryParam`              | URL query parameter management         |
| `useFrappeVersionUpdate`     | Detect Frappe version updates          |

### Dependencies

- `frappe-react-sdk` (core dependency)
- Peer deps: `react`, `react-dom`, `react-router-dom`

---

## Build & Dev Scripts

All scripts are run from the `frontend/` root:

| Command                    | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `npm run dev`              | Start Vite dev server (port 5173) for the app package  |
| `npm run build`            | Install deps → build frappe-ui-react → build app       |
| `npm run build:app`        | Build only the app package                             |
| `npm run build:frappe-ui-react` | Build the linked frappe-ui-react library           |
| `npm run lint`             | ESLint across all packages                             |
| `npm run lint:fix`         | ESLint with auto-fix                                   |

### Dev Server Proxy

The Vite dev server proxies `/app`, `/api`, `/assets`, `/files`, `/private`, and `/socket.io` to the Frappe backend (configured via `VITE_SITE_NAME` and `VITE_SITE_PORT` env vars).

### Build Output

- App build outputs to: `next_pms/public/frontend/`
- After build, `index.html` is copied to `next_pms/www/next-pms/index.html` for Frappe to serve.

---

## Environment Variables

Defined in `frontend/.env` (see `.env.sample`):

| Variable              | Purpose                          |
| --------------------- | -------------------------------- |
| `VITE_BASE_URL`       | Base URL of the Frappe site      |
| `VITE_SOCKET_PORT`    | Dev server port                  |
| `VITE_SITE_NAME`      | Frappe site name for dev proxy   |
| `VITE_ENABLE_SOCKET`  | Enable socket.io in dev          |
| `VITE_SITE_PORT`      | Frappe site port for dev proxy   |

---

## Key Patterns & Conventions

1. **Lazy Loading** – All page components are lazy-loaded via `React.lazy()` with `Suspense` fallback.
2. **Provider Stack** – App wraps everything in a nested provider hierarchy: Toast → Frappe → Theme → User → Redux → Tooltip → Suspense → ErrorFallback → Router.
3. **Path Alias** – `@/` maps to `packages/app/src/` throughout the app package.
4. **Import Ordering** – ESLint enforces import groups: external first (react, react-*, third-party), then internal (`@/**`).
5. **Component Comments** – Files use `/** External dependencies. */` and `/** Internal dependencies. */` section comments.
6. **Barrel Exports** – Each package and sub-directory uses `index.ts` barrel files.
7. **Auth Guard** – The `AuthenticatedRoute` component in `route.tsx` redirects unauthenticated users to `/login`.
8. **Frappe Boot Context** – In dev mode, `main.tsx` fetches boot context via API and sets `window.frappe.boot` before rendering.
9. **SVG as Components** – SVG files can be imported as React components using `?react` suffix (via `vite-plugin-svgr`).
10. **Local Package Link** – `@rtcamp/frappe-ui-react` is linked locally from `../../../frappe-ui-react/packages/frappe-ui-react`.
