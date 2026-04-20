# react-agents-review: Anti-Patterns Reference

Consolidated list of all React anti-patterns organized by category. Each entry includes the anti-pattern, why it is wrong, and the correct approach.

---

## Rules of Hooks Anti-Patterns

### AP-H01: Conditional Hook Call

```tsx
// WRONG
if (isLoggedIn) {
  const [user, setUser] = useState(null);
}
```

**Why**: React tracks Hooks by call order. Conditional calls change the order between renders, corrupting all subsequent Hook state.

**Fix**: ALWAYS call Hooks unconditionally at the top level. Move the condition inside the Hook's logic.

### AP-H02: Hook in Loop

```tsx
// WRONG
for (const id of itemIds) {
  const [data, setData] = useState(null);
}
```

**Why**: The number of Hook calls changes with array length, breaking React's internal mapping.

**Fix**: ALWAYS use a single `useState` with an object or array, or extract each item into a child component with its own state.

### AP-H03: Hook in Nested Function

```tsx
// WRONG
function Component() {
  const handleClick = () => {
    const [count, setCount] = useState(0); // Hook inside callback
  };
}
```

**Why**: Hooks must be called during the render phase. Callbacks execute after render.

**Fix**: ALWAYS place Hook calls at the top level of the component body.

### AP-H04: Missing useEffect Dependencies

```tsx
// WRONG
useEffect(() => {
  fetchData(userId);
}, []); // userId not in deps
```

**Why**: Effect uses `userId` but does not re-run when it changes -- shows stale data.

**Fix**: ALWAYS include all referenced variables in the dependency array: `[userId]`.

### AP-H05: Object in useEffect Dependencies

```tsx
// WRONG
useEffect(() => {
  doSomething(options);
}, [options]); // options is { page: 1 } created each render
```

**Why**: A new object reference is created every render, so the effect runs every render despite identical values.

**Fix**: Destructure to primitives in deps: `[options.page]`, or stabilize with `useMemo`.

---

## TypeScript Anti-Patterns

### AP-T01: Props Typed as `any`

```tsx
// WRONG
function Button(props: any) { ... }
```

**Why**: Defeats TypeScript's purpose. No autocomplete, no compile-time error detection.

**Fix**: ALWAYS define an explicit `interface` for props.

### AP-T02: Untyped Event Handlers

```tsx
// WRONG
const handleChange = (e: any) => { ... };
```

**Why**: Loses type safety for `e.target.value`, `e.currentTarget`, etc.

**Fix**: `(e: React.ChangeEvent<HTMLInputElement>) => { ... }`

### AP-T03: useRef Without null Initial Value

```tsx
// WRONG (for DOM refs)
const ref = useRef<HTMLDivElement>();
```

**Why**: TypeScript infers `MutableRefObject<HTMLDivElement | undefined>`. React assigns `null` initially, not `undefined`. The type is wrong.

**Fix**: `useRef<HTMLDivElement>(null)` -- produces `RefObject<HTMLDivElement>` with correct `null` handling.

### AP-T04: useState Without Generic for Nullable

```tsx
// WRONG
const [user, setUser] = useState(null);
```

**Why**: TypeScript infers `useState<null>` -- you cannot later call `setUser(userData)`.

**Fix**: `useState<User | null>(null)`

### AP-T05: Children Typed as JSX.Element

```tsx
// WRONG
interface Props { children: JSX.Element; }
```

**Why**: Rejects strings, numbers, arrays, fragments, and `null`.

**Fix**: Use `React.ReactNode` for general children content.

---

## Performance Anti-Patterns

### AP-P01: Inline Object Props

```tsx
// WRONG
<Component style={{ color: 'red' }} config={{ theme: 'dark' }} />
```

**Why**: New object reference on every render defeats `React.memo` and causes unnecessary child re-renders.

**Fix**: Define outside component or stabilize with `useMemo`.

### AP-P02: Inline Function Props

```tsx
// WRONG
<Button onClick={() => handleClick(id)} />
```

**Why**: New function reference every render. If `Button` is memoized, the memo is useless.

**Fix**: `useCallback` with stable deps, or restructure so the child component receives the ID as a prop and handles the call.

### AP-P03: Memo on Every Component

```tsx
// WRONG
const SimpleText = React.memo(({ text }: { text: string }) => <span>{text}</span>);
```

**Why**: For trivial components, the comparison cost exceeds the re-render cost. Adds code complexity for negative performance gain.

**Fix**: ONLY use `React.memo` when profiling confirms unnecessary re-renders on components with expensive render logic or many children.

### AP-P04: Index as Key in Dynamic Lists

```tsx
// WRONG
{items.map((item, index) => <Item key={index} data={item} />)}
```

**Why**: When items reorder, insert, or delete, React matches by key. Index keys cause it to update the wrong DOM elements, leading to visual glitches and lost component state.

**Fix**: ALWAYS use `key={item.id}` with a unique, stable identifier.

### AP-P05: Unmemoized Expensive Computation

```tsx
// WRONG
function ProductList({ products, filter }: Props) {
  const filtered = products.filter(p => matchesFilter(p, filter)); // runs every render
}
```

**Why**: If `products` has thousands of entries, filtering runs on every keystroke or unrelated state change.

**Fix**: `useMemo(() => products.filter(...), [products, filter])`

---

## State Management Anti-Patterns

### AP-S01: Derived State in useState

```tsx
// WRONG
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

**Why**: Causes double render. The value is deterministic from existing state -- it does not need its own state.

**Fix**: `const fullName = `${firstName} ${lastName}`;` -- compute during render.

### AP-S02: Props Copied to State

```tsx
// WRONG
function Child({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  // value is now disconnected from parent -- updates to initialValue are lost
}
```

**Why**: State initialized from props creates a copy. Parent prop changes are silently ignored.

**Fix**: If the value should stay in sync with the parent, use the prop directly. If it should be independent, name the prop `initialValue` and document that it only seeds initial state.

### AP-S03: State Duplication

```tsx
// WRONG
const [items, setItems] = useState<Item[]>([]);
const [itemCount, setItemCount] = useState(0);
// Must manually keep itemCount in sync with items.length
```

**Why**: Two sources of truth that can diverge.

**Fix**: `const itemCount = items.length;` -- derive, do not duplicate.

### AP-S04: Context for High-Frequency Updates

```tsx
// WRONG
const MouseContext = createContext({ x: 0, y: 0 });
// Every mousemove re-renders ALL consumers
```

**Why**: Context has no selector mechanism. Every consumer re-renders when any part of the context value changes.

**Fix**: Use an external store (Zustand, Jotai) with selectors for high-frequency data.

### AP-S05: Too Many Related useState Calls

```tsx
// WRONG
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
const [data, setData] = useState<Data | null>(null);
// Must coordinate three state updates in every handler
```

**Why**: Related state updated separately can produce impossible states (e.g., `isLoading: true` AND `error: not null`).

**Fix**: Use `useReducer` to manage related state transitions atomically.

---

## Event Handling Anti-Patterns

### AP-E01: Missing Effect Cleanup

```tsx
// WRONG
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  // no return () => removeEventListener
}, []);
```

**Why**: Listener accumulates on every mount. In Strict Mode (dev), mounts twice immediately.

**Fix**: ALWAYS return a cleanup function from effects that add listeners or subscriptions.

### AP-E02: Stale Closure

```tsx
// WRONG
const [count, setCount] = useState(0);
const handleClick = useCallback(() => {
  console.log(count); // always logs 0
}, []); // count missing from deps
```

**Why**: `handleClick` closes over the initial `count` value and never updates.

**Fix**: Add `count` to the dependency array, or use `setCount(prev => prev + 1)` for state updates.

### AP-E03: useEffect for Event Handler Logic

```tsx
// WRONG
const [query, setQuery] = useState('');
useEffect(() => {
  if (query) {
    search(query); // triggered by effect, not by the event
  }
}, [query]);
```

**Why**: The search is a response to a user action (typing), not a synchronization need. This pattern obscures the data flow and makes it hard to add debouncing or cancel logic.

**Fix**: Call `search(query)` directly in the `onChange` handler (with debounce if needed).

### AP-E04: Async setState After Unmount

```tsx
// WRONG
useEffect(() => {
  fetchData().then(data => setData(data)); // may run after unmount
}, []);
```

**Why**: If the component unmounts before the fetch resolves, `setData` is called on an unmounted component.

**Fix**: Use `AbortController` to cancel the request on cleanup.

---

## Server Component Anti-Patterns

### AP-SC01: Hooks in Server Components

```tsx
// WRONG -- Server Component file (no 'use client')
import { useState } from 'react';
export default function Page() {
  const [count, setCount] = useState(0); // Runtime error
}
```

**Why**: Server Components execute on the server and stream HTML. They cannot maintain client-side state.

**Fix**: Add `'use client'` at the top of the file, or extract the interactive part into a separate Client Component.

### AP-SC02: Non-Serializable Props to Client Components

```tsx
// WRONG
<ClientComponent onSubmit={handleSubmit} createdAt={new Date()} />
```

**Why**: Functions and `Date` objects cannot cross the server-client boundary. Props are serialized to JSON.

**Fix**: Pass serializable data only. Use Server Actions (`'use server'`) for function-like behavior. Pass ISO strings for dates.

### AP-SC03: use client at Page Level

```tsx
// WRONG
'use client'; // Entire page is now a Client Component
export default function DashboardPage() { ... }
```

**Why**: Makes the entire page tree client-rendered, losing all Server Component benefits (smaller bundle, direct data access, streaming).

**Fix**: PUSH `'use client'` to the smallest interactive leaf components.

### AP-SC04: Unvalidated Server Actions

```tsx
// WRONG
'use server';
async function deleteUser(userId: string) {
  await db.users.delete(userId); // trusts client input
}
```

**Why**: Server Actions are public HTTP endpoints. Any client can call them with arbitrary arguments.

**Fix**: ALWAYS validate input (zod, etc.) and check authorization before performing mutations.

---

## Accessibility Anti-Patterns

### AP-A01: Clickable Div

```tsx
// WRONG
<div onClick={handleClick}>Click me</div>
```

**Why**: Not focusable, no keyboard support, not announced as interactive by screen readers.

**Fix**: Use `<button>` for actions, `<a>` for navigation.

### AP-A02: Missing Alt Text

```tsx
// WRONG
<img src={photo.url} />
```

**Why**: Screen readers announce the file name or nothing. Image content is inaccessible.

**Fix**: ALWAYS provide descriptive `alt` text. Use `alt=""` only for purely decorative images.

### AP-A03: Icon-Only Button Without Label

```tsx
// WRONG
<button><TrashIcon /></button>
```

**Why**: Screen reader announces "button" with no description of what it does.

**Fix**: `<button aria-label="Delete item"><TrashIcon /></button>`

### AP-A04: Missing Form Labels

```tsx
// WRONG
<input type="email" placeholder="Email" />
```

**Why**: Placeholder is not a label. It disappears on focus and is not reliably announced.

**Fix**: `<label htmlFor="email">Email</label><input id="email" type="email" />`

### AP-A05: No Live Region for Dynamic Content

```tsx
// WRONG
{isLoading && <div>Loading...</div>}
{error && <div className="error">{error}</div>}
```

**Why**: Screen readers do not announce dynamically appearing content by default.

**Fix**: Wrap in `<div role="status" aria-live="polite">` for loading states, `<div role="alert">` for errors.

---

## Security Anti-Patterns

### AP-SEC01: Unsanitized dangerouslySetInnerHTML

```tsx
// WRONG
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Why**: Direct XSS attack vector. User can inject `<script>` tags or event handlers.

**Fix**: `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }}`

### AP-SEC02: Unvalidated href

```tsx
// WRONG
<a href={userProvidedUrl}>Visit</a>
```

**Why**: User can provide `javascript:alert('xss')` as the URL.

**Fix**: Validate URL scheme: `if (url.startsWith('https://') || url.startsWith('http://'))`.

### AP-SEC03: Secrets in Client State

```tsx
// WRONG
const [apiKey] = useState(process.env.NEXT_PUBLIC_API_SECRET);
```

**Why**: `NEXT_PUBLIC_*` variables are embedded in the client bundle. Anyone can read them.

**Fix**: Keep secrets server-side. Use API routes or Server Actions to proxy authenticated requests.

---

## Testing Anti-Patterns

### AP-TEST01: Implementation Detail Queries

```tsx
// WRONG
container.querySelector('.btn-primary');
wrapper.find('Button').prop('onClick');
```

**Why**: Coupled to CSS classes and component structure. Any refactor breaks the test without changing behavior.

**Fix**: `screen.getByRole('button', { name: /submit/i })`

### AP-TEST02: fireEvent Instead of userEvent

```tsx
// WRONG
fireEvent.change(input, { target: { value: 'text' } });
```

**Why**: `fireEvent` dispatches a single DOM event. Real users trigger focus, keydown, input, change, blur. `fireEvent` misses validation and interaction bugs.

**Fix**: `await userEvent.type(input, 'text')`

### AP-TEST03: No Error State Tests

```tsx
// WRONG -- only tests happy path
test('shows data', async () => {
  mockApi.get.mockResolvedValue(data);
  render(<DataView />);
  expect(await screen.findByText('result')).toBeInTheDocument();
});
```

**Why**: Error and loading states are user-facing UI. Untested states break silently.

**Fix**: Add tests for loading state, error state, empty state, and edge cases.

### AP-TEST04: Enzyme Usage

```tsx
// WRONG
import { shallow } from 'enzyme';
const wrapper = shallow(<Component />);
```

**Why**: Enzyme is unmaintained and does not support React 18+. `shallow` rendering tests implementation details.

**Fix**: ALWAYS use React Testing Library for new tests. Migrate existing Enzyme tests.

### AP-TEST05: Missing Async Handling

```tsx
// WRONG
render(<AsyncComponent />);
expect(screen.getByText('loaded')).toBeInTheDocument(); // fails -- not yet loaded
```

**Why**: Assert runs synchronously before the async state update.

**Fix**: `expect(await screen.findByText('loaded')).toBeInTheDocument()`
