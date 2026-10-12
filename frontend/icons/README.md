# icons

Custom icons that lucide doesn't have. Use `lucide-*` class icons everywhere else (P4), and ask before adding one here.

## Adding one

- One Vue SFC per icon, named `<Name>Icon.vue`, holding an inline `<svg>` with `fill="currentColor"` (or
  `stroke="currentColor"`) so it takes the text colour, and no fixed size, so classes like `size-4` size it.
- Export it from `index.ts`.
- Use it as a component, or pass it to frappe-ui props that accept a component:

  ```vue
  <script setup lang="ts">
  import { GithubIcon } from "../../icons";
  </script>

  <GithubIcon class="size-4 text-ink-gray-7" aria-hidden="true" />
  <Button :icon="GithubIcon" label="Repository" />
  ```

## Icons

| Icon             | Why it's here                                                    |
| ---------------- | ---------------------------------------------------------------- |
| `FilledStarIcon` | Starred tasks; class icons are CSS masks and can't be filled     |
| `GithubIcon`     | GitHub mark for project links; lucide-static dropped brand icons |
