# react-agents-review: Review Scenarios

## Scenario 1: Rules of Hooks Violation

### Bad Code

```tsx
function UserProfile({ userId }: { userId: string | null }) {
  if (!userId) return <div>No user selected</div>;

  // VIOLATION: Hook called after conditional return
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

### What Fails

- Checklist 1, Item 1: Hook call is NOT at the top level -- it appears after a conditional `return`
- React tracks Hooks by call order; early return changes the Hook count between renders

### Fixed Code

```tsx
function UserProfile({ userId }: { userId: string | null }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchUser(userId).then(setUser);
  }, [userId]);

  if (!userId) return <div>No user selected</div>;

  return <div>{user?.name}</div>;
}
```

---

## Scenario 2: Missing Effect Cleanup

### Bad Code

```tsx
function WindowSize() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    // NO cleanup function returned
  }, []);

  return <span>{width}px</span>;
}
```

### What Fails

- Checklist 5, Item 1: `addEventListener` without corresponding `removeEventListener` in cleanup
- Every mount adds a new listener; unmount never removes it -- memory leak

### Fixed Code

```tsx
function WindowSize() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <span>{width}px</span>;
}
```

---

## Scenario 3: Derived State Anti-Pattern

### Bad Code

```tsx
interface Props {
  items: Item[];
  searchTerm: string;
}

function ItemList({ items, searchTerm }: Props) {
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  // ANTI-PATTERN: syncing derived state via useEffect
  useEffect(() => {
    setFilteredItems(items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [items, searchTerm]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### What Fails

- Checklist 4, Item 1: Derived state stored in `useState` and synced via `useEffect`
- Causes an unnecessary extra render cycle: props change -> render with stale filter -> effect runs -> re-render with correct filter

### Fixed Code

```tsx
interface Props {
  items: Item[];
  searchTerm: string;
}

function ItemList({ items, searchTerm }: Props) {
  // Compute directly during render -- no state needed
  const filteredItems = useMemo(
    () => items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [items, searchTerm]
  );

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

---

## Scenario 4: TypeScript Type Safety Gaps

### Bad Code

```tsx
function Form({ onSubmit }: any) {
  const inputRef = useRef<HTMLInputElement>();

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit(inputRef.current.value); // potential null access
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### What Fails

- Checklist 2, Item 1: Props typed as `any`
- Checklist 2, Item 2: Event typed as `any` instead of `React.FormEvent<HTMLFormElement>`
- Checklist 2, Item 3: `useRef` without `null` initial value -- `.current` type does not include `null`, but the actual value is `null` on first render

### Fixed Code

```tsx
interface FormProps {
  onSubmit: (value: string) => void;
}

function Form({ onSubmit }: FormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputRef.current) {
      onSubmit(inputRef.current.value);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Scenario 5: Server Component Boundary Error

### Bad Code

```tsx
// app/dashboard/page.tsx (Server Component by default in Next.js App Router)
import { useState } from 'react';

export default function DashboardPage() {
  const [tab, setTab] = useState('overview'); // ERROR: Hook in Server Component

  return (
    <div>
      <button onClick={() => setTab('overview')}>Overview</button>
      <button onClick={() => setTab('stats')}>Stats</button>
      {tab === 'overview' ? <Overview /> : <Stats />}
    </div>
  );
}
```

### What Fails

- Checklist 8, Item 1: `useState` and event handlers in a Server Component
- Server Components cannot use Hooks or attach event listeners -- they render on the server only

### Fixed Code

```tsx
// app/dashboard/page.tsx (Server Component -- fetches data)
import { TabNavigation } from './tab-navigation';
import { getOverviewData, getStatsData } from '@/lib/data';

export default async function DashboardPage() {
  const [overviewData, statsData] = await Promise.all([
    getOverviewData(),
    getStatsData(),
  ]);

  return (
    <TabNavigation
      overviewData={overviewData}
      statsData={statsData}
    />
  );
}

// app/dashboard/tab-navigation.tsx (Client Component -- handles interactivity)
'use client';

import { useState } from 'react';

interface TabNavigationProps {
  overviewData: OverviewData;
  statsData: StatsData;
}

export function TabNavigation({ overviewData, statsData }: TabNavigationProps) {
  const [tab, setTab] = useState<'overview' | 'stats'>('overview');

  return (
    <div>
      <button onClick={() => setTab('overview')}>Overview</button>
      <button onClick={() => setTab('stats')}>Stats</button>
      {tab === 'overview' ? (
        <Overview data={overviewData} />
      ) : (
        <Stats data={statsData} />
      )}
    </div>
  );
}
```

---

## Scenario 6: Accessibility Failures

### Bad Code

```tsx
function ImageGallery({ images }: { images: Image[] }) {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      {images.map((img, i) => (
        <div
          key={img.id}
          onClick={() => setSelected(i)}
          style={{ border: i === selected ? '2px solid blue' : 'none' }}
        >
          <img src={img.url} />
        </div>
      ))}
    </div>
  );
}
```

### What Fails

- Checklist 9, Item 1: No accessible name on the clickable div
- Checklist 9, Item 2: `<div onClick>` instead of `<button>` for interactive element
- Checklist 9, Item 3: No keyboard navigation -- `<div>` is not focusable
- Missing `alt` attribute on `<img>`

### Fixed Code

```tsx
function ImageGallery({ images }: { images: Image[] }) {
  const [selected, setSelected] = useState(0);

  return (
    <div role="listbox" aria-label="Image gallery">
      {images.map((img, i) => (
        <button
          key={img.id}
          role="option"
          aria-selected={i === selected}
          onClick={() => setSelected(i)}
          style={{
            border: i === selected ? '2px solid blue' : 'none',
            background: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <img src={img.url} alt={img.description} />
        </button>
      ))}
    </div>
  );
}
```

---

## Scenario 7: Testing Anti-Patterns

### Bad Code

```tsx
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';

test('counter increments', () => {
  const { container } = render(<Counter />);
  const button = container.querySelector('.increment-btn');
  fireEvent.click(button!);
  const display = container.querySelector('.count-display');
  expect(display?.textContent).toBe('1');
});
```

### What Fails

- Checklist 11, Item 1: Queries use CSS selectors (`.increment-btn`, `.count-display`) instead of roles or text
- Checklist 11, Item 3: `fireEvent` used instead of `userEvent` for user-driven interaction
- Test is coupled to class names -- refactoring CSS breaks the test

### Fixed Code

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('counter increments when increment button is clicked', async () => {
  render(<Counter />);

  const button = screen.getByRole('button', { name: /increment/i });
  await userEvent.click(button);

  expect(screen.getByText('1')).toBeInTheDocument();
});
```

---

## Scenario 8: Stale Closure in Async Effect

### Bad Code

```tsx
function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    fetch(`/api/search?q=${query}`)
      .then(res => res.json())
      .then(data => setResults(data));
  }, [query]);

  return <ResultList results={results} />;
}
```

### What Fails

- Checklist 5, Item 3: No abort handling -- if `query` changes rapidly, responses arrive out of order and the UI shows results for a stale query
- Race condition: fast typing sends multiple requests; last response wins regardless of query order

### Fixed Code

```tsx
function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(err => {
        if (err.name !== 'AbortError') throw err;
      });

    return () => controller.abort();
  }, [query]);

  return <ResultList results={results} />;
}
```

---

## Scenario 9: Premature Optimization

### Bad Code

```tsx
const Label = React.memo(({ text }: { text: string }) => {
  return <span>{text}</span>;
});

const Divider = React.memo(() => {
  return <hr />;
});

const Page = React.memo(({ title }: { title: string }) => {
  return (
    <div>
      <Label text={title} />
      <Divider />
    </div>
  );
});
```

### What Fails

- Checklist 3, Item 2: `React.memo` applied to trivial components
- `Label` receives a primitive string -- comparison cost is comparable to re-render cost
- `Divider` has no props -- `React.memo` comparison is pure overhead
- The shallow comparison on every render likely costs MORE than just re-rendering these tiny components

### Fixed Code

```tsx
function Label({ text }: { text: string }) {
  return <span>{text}</span>;
}

function Divider() {
  return <hr />;
}

function Page({ title }: { title: string }) {
  return (
    <div>
      <Label text={title} />
      <Divider />
    </div>
  );
}
```

Reserve `React.memo` for components where profiling shows measurable unnecessary re-renders with complex prop trees or expensive render logic.
