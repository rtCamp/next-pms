---
name: react-agents-review
description: >
  Use when reviewing React code, validating a React project, or performing code
  review for correctness. Prevents shipping code with Rules of Hooks violations,
  type safety gaps, performance anti-patterns, or accessibility issues. Covers
  hooks compliance, TypeScript safety, Server Component boundaries, state
  management, event cleanup, testing patterns.
  Keywords: code review, validation, Rules of Hooks, anti-patterns, accessibility, review React code, check for bugs, anti-pattern scan, code quality, accessibility check..
license: MIT
compatibility: "Designed for Claude Code. Requires React 18.x or 19.x with TypeScript."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# react-agents-review

## Quick Reference

This skill provides a structured validation checklist for reviewing generated React code. Run each checklist area sequentially against the code under review. Every item uses the format:

- **[CHECK]** What to verify
- **[PASS]** Expected correct state
- **[FAIL]** Common failure mode and fix

### Critical Warnings

**NEVER** approve code with conditional Hook calls -- this breaks React's internal state tracking and causes silent corruption across re-renders.

**NEVER** approve `useEffect` without verifying its cleanup function -- missing cleanup causes memory leaks, stale subscriptions, and zombie event listeners.

**NEVER** approve `dangerouslySetInnerHTML` without DOMPurify or equivalent sanitization -- this is a direct XSS attack vector.

**NEVER** approve components over 300 lines without flagging for decomposition -- God components are untestable and unmaintainable.

**ALWAYS** verify TypeScript types are explicit on all props interfaces -- `any` types defeat the purpose of TypeScript and hide bugs.

---

## Checklist 1: Rules of Hooks

- **[CHECK]** All Hook calls are at the top level of the component or custom Hook
- **[PASS]** Hooks appear before any `return`, `if`, `for`, `while`, or `switch` statement
- **[FAIL]** Hook called inside a condition, loop, or nested function -- MOVE it to top level and guard the logic inside the Hook instead

- **[CHECK]** Hooks are ONLY called from React function components or custom Hooks
- **[PASS]** Calling function starts with uppercase (component) or `use` (custom Hook)
- **[FAIL]** Hook called from a plain utility function -- EXTRACT into a custom Hook prefixed with `use`

- **[CHECK]** `useEffect` dependency arrays are complete
- **[PASS]** Every variable referenced inside the effect callback appears in the dependency array
- **[FAIL]** Missing dependency causes stale closures -- ADD the missing dependency or wrap the value in `useRef` if intentionally stable

- **[CHECK]** `useMemo`/`useCallback` dependency arrays match usage
- **[PASS]** All referenced values in the memoized computation are listed as dependencies
- **[FAIL]** Stale memoized value returned -- ADD missing dependencies

- **[CHECK]** Custom Hooks follow naming convention
- **[PASS]** Custom Hook name starts with `use` followed by an uppercase letter (e.g., `useFormState`)
- **[FAIL]** Hook not recognized by React linter -- RENAME to start with `use`

---

## Checklist 2: TypeScript Type Safety

- **[CHECK]** Component props use an explicit `interface` or `type`
- **[PASS]** `interface Props { ... }` defined and applied: `function Component(props: Props)` or destructured
- **[FAIL]** Props typed as `any`, `object`, or not typed -- DEFINE an explicit interface

- **[CHECK]** Event handlers use correct React event types
- **[PASS]** `React.MouseEvent<HTMLButtonElement>`, `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`
- **[FAIL]** Event typed as `any` or generic `Event` -- USE the specific `React.*Event<HTMLElement>` type

- **[CHECK]** Refs are correctly typed with `useRef`
- **[PASS]** `useRef<HTMLDivElement>(null)` with initial `null` for DOM refs; `useRef<number>(0)` for mutable values
- **[FAIL]** `useRef<HTMLElement>()` without `null` initial value -- the `.current` type excludes `null`, causing runtime errors on first render

- **[CHECK]** State is typed explicitly when not inferable
- **[PASS]** `useState<User | null>(null)` when initial value does not reflect full type range
- **[FAIL]** `useState(null)` without generic -- TypeScript infers `null` only, blocking later assignments

- **[CHECK]** `createContext` uses a generic type
- **[PASS]** `createContext<ThemeContextType | null>(null)` with a defined context type
- **[FAIL]** `createContext({})` with no type -- consumers receive `{}` type, no autocompletion or safety

- **[CHECK]** Children prop uses correct type
- **[PASS]** `React.ReactNode` for general children; `React.ReactElement` when exactly one element required
- **[FAIL]** `children: JSX.Element` -- does not accept strings, numbers, fragments, or arrays

---

## Checklist 3: Performance

- **[CHECK]** Components receiving non-primitive props are wrapped with `React.memo` where appropriate
- **[PASS]** `React.memo(Component)` applied to components that re-render with unchanged props due to parent re-renders
- **[FAIL]** Component re-renders on every parent render despite stable props -- WRAP with `React.memo`

- **[CHECK]** `React.memo` is NOT applied prematurely
- **[PASS]** `React.memo` used only when profiling confirms unnecessary re-renders
- **[FAIL]** Every component wrapped in `React.memo` -- REMOVE from simple components where the comparison cost exceeds re-render cost

- **[CHECK]** Object/array/function props are referentially stable
- **[PASS]** Objects created via `useMemo`, functions via `useCallback`, or defined outside the component
- **[FAIL]** Inline `{{ color: 'red' }}` or `() => handleClick(id)` in JSX -- EXTRACT with `useMemo`/`useCallback` or move to module scope

- **[CHECK]** React Compiler readiness (React 19)
- **[PASS]** No manual `useMemo`/`useCallback` that the compiler would auto-generate; pure component logic
- **[FAIL]** Complex memoization chains that fight the compiler -- SIMPLIFY and let the compiler optimize

- **[CHECK]** Expensive computations are memoized
- **[PASS]** `useMemo(() => expensiveFilter(items), [items])` for O(n) or worse operations
- **[FAIL]** Filtering/sorting a large array on every render -- WRAP in `useMemo` with correct dependencies

- **[CHECK]** Lists use stable, unique keys
- **[PASS]** `key={item.id}` using a unique identifier from the data
- **[FAIL]** `key={index}` on a list that can reorder, filter, or insert -- USE a stable unique ID

---

## Checklist 4: State Management

- **[CHECK]** No derived state stored in `useState`
- **[PASS]** Derived values computed directly in the render body: `const fullName = first + ' ' + last`
- **[FAIL]** `useEffect` syncing derived state from props/other state -- REMOVE the state and compute inline

- **[CHECK]** No state duplication
- **[PASS]** Single source of truth for each piece of data
- **[FAIL]** Same data stored in multiple `useState` calls that must be kept in sync -- CONSOLIDATE into one state or derive

- **[CHECK]** Appropriate state colocation
- **[PASS]** State lives in the lowest common ancestor that needs it
- **[FAIL]** State lifted to app root when only two sibling components need it -- MOVE state down

- **[CHECK]** Context vs prop drilling vs external store is appropriate
- **[PASS]** Props for 1-2 levels; Context for widely-shared low-frequency data; external store (Zustand/Redux) for high-frequency cross-cutting state
- **[FAIL]** Context used for rapidly changing values (mouse position, animation frames) -- USE an external store with selectors

- **[CHECK]** `useReducer` used for complex state logic
- **[PASS]** Related state transitions grouped in a reducer when 3+ `useState` calls interact
- **[FAIL]** Multiple `useState` calls updated together in event handlers -- CONSOLIDATE into `useReducer`

---

## Checklist 5: Event Handling and Effects

- **[CHECK]** `useEffect` includes cleanup for subscriptions and listeners
- **[PASS]** Returns cleanup function: `return () => { subscription.unsubscribe(); }`
- **[FAIL]** `addEventListener` without corresponding `removeEventListener` in cleanup -- ADD cleanup return

- **[CHECK]** No stale closures in event handlers
- **[PASS]** Event handlers reference current state via `useCallback` with correct deps, or use functional state updates
- **[FAIL]** Handler captures initial state value and never updates -- USE `setState(prev => ...)` or add to `useCallback` deps

- **[CHECK]** Async effects handle component unmount
- **[PASS]** Uses abort controller or boolean flag: `const aborted = { current: false }; return () => { aborted.current = true; }`
- **[FAIL]** `setState` called after unmount in an async callback -- ADD abort/cancelled check

- **[CHECK]** `useEffect` is not used for event handlers
- **[PASS]** Click/submit handlers attached directly via JSX `onClick`/`onSubmit`
- **[FAIL]** `useEffect` with state dependency that triggers an action -- MOVE logic to the event handler that changes the state

---

## Checklist 6: Forms

- **[CHECK]** Controlled vs uncontrolled pattern is consistent
- **[PASS]** Controlled: `value={state}` + `onChange`; Uncontrolled: `defaultValue` + `ref`
- **[FAIL]** Mixing `value` and `defaultValue` or switching between controlled/uncontrolled -- CHOOSE one pattern

- **[CHECK]** Form validation provides user feedback
- **[PASS]** Validation errors displayed per-field with `aria-describedby` linking error to input
- **[FAIL]** Silent validation failure or only `console.log` -- ADD visible error messages

- **[CHECK]** React 19 form actions used where appropriate
- **[PASS]** `<form action={submitAction}>` with `useActionState` for server-side form handling
- **[FAIL]** Manual `onSubmit` + `preventDefault` + fetch in React 19 -- CONSIDER `useActionState` for simpler data flow

---

## Checklist 7: Component Patterns

- **[CHECK]** Component is under 300 lines
- **[PASS]** Focused, single-responsibility component
- **[FAIL]** God component with multiple concerns -- SPLIT into smaller components using composition

- **[CHECK]** Composition over configuration
- **[PASS]** Uses `children`, render props, or slots for flexible content injection
- **[FAIL]** Massive prop interface with 10+ boolean flags controlling rendering -- REFACTOR to composition pattern

- **[CHECK]** Key prop usage is correct
- **[PASS]** Keys on the outermost element in a `.map()` call; keys are stable and unique among siblings
- **[FAIL]** Key placed on an inner element, or key is `Math.random()` -- MOVE key to outermost mapped element and use stable ID

---

## Checklist 8: Server Components (React 19 / Next.js App Router)

- **[CHECK]** No client-only code in Server Components
- **[PASS]** Server Components contain NO `useState`, `useEffect`, `useRef`, event handlers, or browser APIs
- **[FAIL]** Hook or `window` reference in a Server Component -- ADD `'use client'` directive or extract to a Client Component

- **[CHECK]** Props passed from Server to Client Components are serializable
- **[PASS]** Props are plain objects, arrays, strings, numbers, booleans, or `null`
- **[FAIL]** Functions, classes, `Date` objects, or `Map`/`Set` passed as props -- SERIALIZE or restructure

- **[CHECK]** `'use client'` boundary is intentional and minimal
- **[PASS]** `'use client'` placed at the lowest component that needs interactivity; Server Components compose above it
- **[FAIL]** `'use client'` at the page level, converting the entire tree to client -- PUSH the boundary down

- **[CHECK]** `'use server'` functions validate input
- **[PASS]** Server Actions validate and sanitize all parameters before use
- **[FAIL]** Server Action trusts client input directly -- ADD validation with zod or similar

---

## Checklist 9: Accessibility

- **[CHECK]** Interactive elements have accessible names
- **[PASS]** Buttons have text content or `aria-label`; inputs have associated `<label>` or `aria-label`
- **[FAIL]** Icon-only button with no accessible name -- ADD `aria-label` describing the action

- **[CHECK]** Semantic HTML is used
- **[PASS]** `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, `<header>`, `<section>` for structure
- **[FAIL]** `<div onClick>` instead of `<button>` -- REPLACE with the semantic element

- **[CHECK]** Keyboard navigation works
- **[PASS]** All interactive elements are focusable and operable with keyboard; custom widgets implement ARIA keyboard patterns
- **[FAIL]** Custom dropdown only works with mouse -- ADD `onKeyDown` handling for Arrow/Enter/Escape keys

- **[CHECK]** Dynamic content updates are announced
- **[PASS]** `aria-live="polite"` on regions that update asynchronously (toast messages, loading states)
- **[FAIL]** Content appears/disappears with no screen reader announcement -- ADD `aria-live` region

---

## Checklist 10: Security

- **[CHECK]** `dangerouslySetInnerHTML` content is sanitized
- **[PASS]** Input passed through DOMPurify: `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}`
- **[FAIL]** Raw user input in `dangerouslySetInnerHTML` -- ADD DOMPurify.sanitize() or remove

- **[CHECK]** User input is not interpolated into `href` without validation
- **[PASS]** URLs validated against allowlist or parsed with `new URL()` to block `javascript:` protocol
- **[FAIL]** `<a href={userInput}>` without validation -- ADD URL validation

- **[CHECK]** No sensitive data in client-side state
- **[PASS]** Tokens stored in httpOnly cookies; secrets stay server-side
- **[FAIL]** API keys or tokens in `useState` or `localStorage` accessible to XSS -- MOVE to server-side session

---

## Checklist 11: Testing

- **[CHECK]** Tests query by role, label, or text -- NOT by implementation details
- **[PASS]** `screen.getByRole('button', { name: /submit/i })`, `screen.getByLabelText('Email')`
- **[FAIL]** `container.querySelector('.btn-primary')` or `getByTestId` as first choice -- USE role-based queries

- **[CHECK]** Error and loading states are tested
- **[PASS]** Tests cover: initial render, loading state, success state, error state
- **[FAIL]** Only happy-path test -- ADD tests for loading and error scenarios

- **[CHECK]** User interactions use `userEvent` over `fireEvent`
- **[PASS]** `await userEvent.click(button)` for realistic event simulation
- **[FAIL]** `fireEvent.click(button)` for user-driven interactions -- USE `@testing-library/user-event`

- **[CHECK]** Async operations are properly awaited
- **[PASS]** `await screen.findByText('loaded')` or `await waitFor(() => expect(...))` for async state updates
- **[FAIL]** Assertion runs before async update completes -- USE `findBy` queries or `waitFor`

- **[CHECK]** No Enzyme usage in new code
- **[PASS]** React Testing Library used for all component tests
- **[FAIL]** `shallow()` or `mount()` from Enzyme -- MIGRATE to React Testing Library

---

## Review Execution Order

When reviewing React code, ALWAYS run checklists in this order:

1. **Rules of Hooks** (Checklist 1) -- incorrect Hook usage breaks the entire component
2. **TypeScript** (Checklist 2) -- type errors propagate through the component tree
3. **State Management** (Checklist 4) -- wrong state architecture causes cascading issues
4. **Event Handling** (Checklist 5) -- memory leaks and stale closures are silent bugs
5. **Server Components** (Checklist 8) -- boundary errors crash at runtime
6. **Security** (Checklist 10) -- XSS vulnerabilities must be caught early
7. **Performance** (Checklist 3) -- optimize after correctness
8. **Forms** (Checklist 6) -- validation and pattern consistency
9. **Component Patterns** (Checklist 7) -- structural improvements
10. **Accessibility** (Checklist 9) -- ensure inclusive design
11. **Testing** (Checklist 11) -- verify test quality

---

## Reference Links

- [references/examples.md](references/examples.md) -- Review scenarios with good code, bad code, and fixes
- [references/anti-patterns.md](references/anti-patterns.md) -- All anti-patterns consolidated across all checklist areas

### Official Sources

- https://react.dev/reference/rules/rules-of-hooks
- https://react.dev/learn/you-might-not-need-an-effect
- https://react.dev/reference/react/memo
- https://react.dev/reference/react/useEffect
- https://react.dev/learn/thinking-in-react
- https://react.dev/reference/rsc/server-components
- https://react.dev/learn/typescript
- https://testing-library.com/docs/react-testing-library/intro
