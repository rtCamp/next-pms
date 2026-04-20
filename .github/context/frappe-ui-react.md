# Project Details

## frappe-ui-react

A React component library for Frappe applications, published as `@rtcamp/frappe-ui-react`.

### Tech Stack

- **Language:** TypeScript
- **UI framework:** React 19
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Rich text:** TipTap
- **Charts:** ECharts
- **Icons:** Lucide React, Feather Icons
- **CSS utilities:** clsx, tailwind-merge, class-variance-authority (CVA)
- **Date handling:** Day.js
- **Grid layout:** react-grid-layout
- **Package manager:** pnpm (>= 10)
- **Build:** TypeScript compiler (`tsc`) — no bundler; assets copied via `scripts/copy-assets.js`
- **Storybook:** v10 (React + Vite) on port 6006
- **Unit tests:** Jest (config in `tests/unitTest.jest.config.cjs`) + Storybook interaction tests via Vitest + Playwright
- **Linting:** ESLint (flat config), Prettier
- **Git hooks:** Husky

### Monorepo Layout

pnpm workspace (`pnpm-workspace.yaml: packages/*`).

```
frappe-ui-react/               # workspace root
├── package.json               # root scripts (dev, build, storybook, test, lint, publish)
├── vite.config.ts             # Storybook/Vitest config; path alias @rtcamp/frappe-ui-react → packages/frappe-ui-react/src
├── tsconfig.json              # root tsconfig with project references
├── .storybook/                # Storybook config (main.ts, preview.ts, modeDecorator.tsx)
├── tests/                     # Jest mocks and config
├── bin/                       # local Verdaccio registry scripts (for local publishing)
└── packages/
    └── frappe-ui-react/       # the publishable package (@rtcamp/frappe-ui-react)
        ├── package.json       # package metadata, exports, dependencies
        ├── tsconfig.json      # extends ../../tsconfig.app.json; outDir=dist, declarationDir=dist-types
        ├── scripts/
        │   └── copy-assets.js # copies CSS, SVG, and other non-TS assets to dist/
        ├── dist/              # compiled JS output
        ├── dist-types/        # generated .d.ts files
        └── src/               # source code
```

### Source Structure (`packages/frappe-ui-react/src/`)

```
src/
├── index.ts          # barrel — re-exports components/ and icons/
├── theme.css         # base theme CSS
├── themeV3.css       # v3 theme CSS
├── vite-env.d.ts     # Vite type references
├── @types/           # ambient type declarations (index.d.ts)
├── assets/           # static assets (images, etc.)
├── common/           # shared types (types.ts)
├── icons/            # SVG icons + React icon barrel (index.tsx)
├── test-utils/       # test helpers (mockData.ts)
├── utils/            # utility functions
│   ├── cn.ts                # className merge helper (clsx + tailwind-merge)
│   ├── config.ts            # global config
│   ├── dayjs.ts             # Day.js setup
│   ├── debounce.ts
│   ├── fileUploadHandler.ts
│   ├── htmlAttrsToJsx.ts
│   ├── noop.ts
│   ├── tailwind.config.cjs  # Tailwind preset (exported as ./tailwind/preset)
│   └── tailwindExtend.json  # Tailwind theme extensions
└── components/       # UI components (each in its own directory)
    ├── index.ts      # barrel re-exporting all components
    ├── hooks/        # shared React hooks (useResource, useWindowSize)
    └── <component>/  # one folder per component
```

### Package Exports

The published package exposes these entry points:

| Import path | Resolved to |
|---|---|
| `@rtcamp/frappe-ui-react` | `dist/index.js` (types: `dist-types/index.d.ts`) |
| `@rtcamp/frappe-ui-react/theme` | `dist/theme.css` |
| `@rtcamp/frappe-ui-react/theme-v3` | `dist/themeV3.css` |
| `@rtcamp/frappe-ui-react/tailwind/preset` | `dist/utils/tailwind.config.cjs` |

### Components

Each component lives in `src/components/<name>/` and typically contains:
- `<Name>.tsx` — the main component
- `<Name>.stories.tsx` — Storybook stories
- `<Name>.test.tsx` — unit tests (if present)
- `index.ts` — barrel export

Available components:
alert, autoComplete, avatar, badge, breadcrumbs, button, calendar, card, charts, checkbox, circularProgressBar, combobox, commandPalette, datePicker, dialog, divider, dropdown, durationInput, errorMessage, fileUploader, filter, formControl, formLabel, gridLayout, keyboardShortcut, label, listview, loadingIndicator, loadingText, multiSelect, password, popover, progress, rating, select, sidebar, skeleton, spinner, switch, tabButtons, tabs, taskStatus, textEditor, textInput, textarea, timesheet, toast, tooltip, tree, typography, featherIcon.

### Key Commands

| Task | Command |
|---|---|
| Install deps | `pnpm install` |
| Dev (watch build) | `pnpm dev` |
| Build package | `pnpm build` |
| Run Storybook | `pnpm storybook` |
| Unit tests | `pnpm test:unit` |
| Lint | `pnpm lint` |
| Format | `pnpm format` |
| Publish to local registry | `pnpm local-registry:start` then `pnpm build:publish:local` |
| Publish to npm | `pnpm build:publish:remote` |

### Path Aliases

- `@rtcamp/frappe-ui-react` → `packages/frappe-ui-react/src` (in Vite and tsconfig)
- `@rtcamp/*` → `packages/frappe-ui-react/src/*` (in package tsconfig)

### Storybook MCP Server

The project includes a Storybook MCP server via `@storybook/addon-mcp` (v0.6.0). This exposes component metadata, stories, and documentation over the Model Context Protocol so LLMs can query Storybook at runtime.

**Usage:**

1. Start Storybook: `pnpm storybook` (runs on port 6006).
2. The MCP server becomes available automatically — no separate process needed.
3. Add the MCP server to your editor. In VS Code, create or update `.vscode/mcp.json` with an HTTP-type server pointing to `http://localhost:6006/mcp`. Other editors or tools that support MCP can connect to the same URL.
4. LLMs can then use MCP tools to look up component props, browse available stories, and read component documentation directly from the running Storybook instance.

**Prerequisites:**

- Storybook must be running (`pnpm storybook`) for the MCP endpoint to be reachable.
- The addon is only loaded in development (`NODE_ENV !== "production"`).

