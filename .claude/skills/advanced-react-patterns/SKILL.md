---
name: advanced-react-patterns
description: Advanced React development patterns, performance optimization, and architecture best practices. Use when building React applications, debugging performance issues, implementing state management, working with re-renders, memoization, composition patterns, data fetching, error handling, or when the user needs guidance on React best practices including useEffect, useCallback, useMemo, React.memo, Context, Portals, Refs, closures, debouncing, or error boundaries.
---

# Advanced React Patterns

Comprehensive guide for advanced React development focusing on performance, architecture patterns, and best practices.

## Core Principles

### Re-renders are not the enemy
Re-renders are how React updates components with new data. Without re-renders, there's no interactivity. The goal is to optimize unnecessary re-renders, not eliminate all re-renders.

### Composition over memoization
Always prefer composition patterns (moving state down, children as props, component as props) over React.memo/useMemo/useCallback. Memoization should be a last resort when composition isn't viable.

### Measure before optimizing
Never assume performance problems. Use React DevTools Profiler and browser performance tools to identify actual bottlenecks before applying optimizations.

## Performance Patterns

### 1. Moving State Down

Extract state to the smallest possible component to limit re-render scope.

**Anti-pattern:**
```jsx
const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open</Button>
      {isOpen && <Dialog onClose={() => setIsOpen(false)} />}
      <VerySlowComponent />
      <AnotherSlowComponent />
    </>
  );
};
```

**Pattern:**
```jsx
const ButtonWithDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open</Button>
      {isOpen && <Dialog onClose={() => setIsOpen(false)} />}
    </>
  );
};

const App = () => {
  return (
    <>
      <ButtonWithDialog />
      <VerySlowComponent />
      <AnotherSlowComponent />
    </>
  );
};
```

### 2. Children as Props

Pass heavy components as children to isolate state updates.

```jsx
const ScrollableArea = ({ children }) => {
  const [position, setPosition] = useState(0);
  const onScroll = (e) => setPosition(e.target.scrollTop);
  
  return (
    <div onScroll={onScroll}>
      <MovingBlock position={position} />
      {children}
    </div>
  );
};

const App = () => {
  return (
    <ScrollableArea>
      <VerySlowComponent />
      <AnotherSlowComponent />
    </ScrollableArea>
  );
};
```

### 3. Component as Props

Pass components as props for flexible composition and performance.

```jsx
const Layout = ({ sidebar, content }) => {
  const [theme, setTheme] = useState('light');
  return (
    <div className={theme}>
      <div className="sidebar">{sidebar}</div>
      <div className="content">{content}</div>
    </div>
  );
};

// Usage - sidebar and content won't re-render when theme changes
<Layout 
  sidebar={<Sidebar />} 
  content={<MainContent />} 
/>
```

## Memoization (Use Sparingly)

### React.memo Rules

Only use React.memo when composition patterns don't work and you've measured actual performance issues.

**Critical requirements for React.memo to work:**
1. ALL props must be memoized (primitives or stable references)
2. No spreading props from other components
3. Children must be memoized with useMemo
4. Avoid passing non-primitive values from custom hooks

```jsx
const ChildMemo = React.memo(Child);

const Parent = () => {
  // Memoize ALL non-primitive props
  const data = useMemo(() => ({ id: 1 }), []);
  const onClick = useCallback(() => {}, []);
  const children = useMemo(() => <div>Content</div>, []);
  
  return (
    <ChildMemo 
      data={data} 
      onClick={onClick}
    >
      {children}
    </ChildMemo>
  );
};
```

### useMemo and useCallback

**When to use:**
- Values/functions passed to React.memo components
- Values/functions used in hook dependencies
- Expensive calculations (but measure first!)

**When NOT to use:**
- Props on non-memoized components (anti-pattern!)
- Components that never re-render
- "Just in case" memoization

```jsx
// ❌ Anti-pattern: memoizing props on non-memoized component
const Component = () => {
  const onClick = useCallback(() => {}, []); // Useless!
  return <button onClick={onClick}>Click</button>;
};

// ✅ Correct: memoizing for dependencies
const Component = () => {
  const fetchData = useCallback(async () => {
    // fetch implementation
  }, []);
  
  useEffect(() => {
    fetchData(); // fetchData won't change, so effect runs once
  }, [fetchData]);
};
```

## Context Patterns

### Context Value Memoization

Always memoize Context values to prevent unnecessary re-renders.

```jsx
const MyContext = React.createContext();

const MyProvider = ({ children }) => {
  const [state, setState] = useState();
  
  // Always memoize the value
  const value = useMemo(() => ({
    state,
    setState
  }), [state]);
  
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};
```

### Split Providers Pattern

Split data and API to optimize Context re-renders.

```jsx
const DataContext = React.createContext();
const ApiContext = React.createContext();

const Provider = ({ children }) => {
  const [state, setState] = useState();
  
  const data = useMemo(() => ({ state }), [state]);
  const api = useMemo(() => ({
    update: () => setState(/* ... */)
  }), []); // No dependencies - never changes
  
  return (
    <DataContext.Provider value={data}>
      <ApiContext.Provider value={api}>
        {children}
      </ApiContext.Provider>
    </DataContext.Provider>
  );
};
```

## Refs Patterns

### When to Use Refs vs State

**Use Ref when:**
- Value not used in rendering
- Value not passed as props
- Need synchronous updates
- Storing DOM elements
- Storing timers/intervals

**Use State when:**
- Value affects rendering
- Value passed to other components

### Escaping Stale Closures with Refs

Use Refs to access latest values in memoized callbacks without breaking memoization.

```jsx
const Component = () => {
  const [value, setValue] = useState();
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value; // Update ref with latest value
  });
  
  const onClick = useCallback(() => {
    // Access latest value without dependencies
    console.log(ref.current);
  }, []); // Empty deps - never recreated
  
  return <ExpensiveMemoizedComponent onClick={onClick} />;
};
```

### Debouncing with Refs

Implement debouncing that has access to latest state.

```jsx
const useDebounce = (callback) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  const debouncedCallback = useMemo(() => {
    const func = () => {
      callbackRef.current?.();
    };
    return debounce(func, 500);
  }, []);
  
  return debouncedCallback;
};
```

## Data Fetching Patterns

### Parallel Data Fetching

Avoid request waterfalls by fetching data in parallel.

**Anti-pattern (Waterfall):**
```jsx
const Page = () => {
  const [data, setData] = useState();
  useEffect(() => {
    fetch('/api/data').then(setData);
  }, []);
  if (!data) return 'loading';
  return <Child id={data.id} />;
};

const Child = ({ id }) => {
  const [childData, setChildData] = useState();
  useEffect(() => {
    fetch(`/api/child/${id}`).then(setChildData);
  }, [id]);
  // ...
};
```

**Pattern (Parallel):**
```jsx
const Page = () => {
  const [data, setData] = useState();
  const [childData, setChildData] = useState();
  
  useEffect(() => {
    // Fire both requests in parallel
    fetch('/api/data').then(setData);
    fetch('/api/child/1').then(setChildData);
  }, []);
  
  if (!data || !childData) return 'loading';
  return <Child data={childData} />;
};
```

### Data Provider Pattern

Use Context to abstract data fetching from component hierarchy.

```jsx
const DataProvider = ({ children, url }) => {
  const [data, setData] = useState();
  
  useEffect(() => {
    fetch(url).then(r => r.json()).then(setData);
  }, [url]);
  
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
};

// Wrap app to trigger parallel requests
<DataProvider url="/api/sidebar">
  <DataProvider url="/api/main">
    <DataProvider url="/api/comments">
      <App />
    </DataProvider>
  </DataProvider>
</DataProvider>
```

### Race Condition Prevention

**Method 1: Cleanup with boolean flag**
```jsx
useEffect(() => {
  let isActive = true;
  
  fetch(url).then(data => {
    if (isActive) {
      setData(data);
    }
  });
  
  return () => {
    isActive = false;
  };
}, [url]);
```

**Method 2: AbortController**
```jsx
useEffect(() => {
  const controller = new AbortController();
  
  fetch(url, { signal: controller.signal })
    .then(data => setData(data))
    .catch(error => {
      if (error.name !== 'AbortError') {
        // Handle real errors
      }
    });
  
  return () => controller.abort();
}, [url]);
```

## Error Handling

### ErrorBoundary Pattern

Create reusable ErrorBoundary component.

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorScreen />}>
  <App />
</ErrorBoundary>
```

### Catching Async Errors in ErrorBoundary

Use state updater to re-throw async errors into React lifecycle.

```jsx
const useAsyncError = () => {
  const [, setState] = useState();
  
  return (error) => {
    setState(() => {
      throw error;
    });
  };
};

const Component = () => {
  const throwAsyncError = useAsyncError();
  
  useEffect(() => {
    fetch('/api')
      .catch(error => throwAsyncError(error));
  }, []);
};
```

## Common Anti-Patterns to Avoid

### 1. Never Define Components Inside Components

```jsx
// ❌ Wrong - causes remounting on every render
const Parent = () => {
  const Child = () => <div>Child</div>;
  return <Child />;
};

// ✅ Correct
const Child = () => <div>Child</div>;
const Parent = () => <Child />;
```

### 2. Don't Use Unnecessary Keys

```jsx
// ❌ Wrong - breaks memoization
const items = data.map((item, index) => (
  <Item key={index} {...item} />
));

// ✅ Correct - use stable IDs
const items = data.map(item => (
  <Item key={item.id} {...item} />
));
```

### 3. Avoid Inline Objects/Arrays in Props

```jsx
// ❌ Wrong - creates new object every render
<Component style={{ color: 'red' }} />

// ✅ Correct - stable reference
const style = { color: 'red' };
<Component style={style} />
```

### 4. Don't Fetch in Render

```jsx
// ❌ Wrong - creates waterfall
if (!data) {
  fetch('/api').then(setData);
}

// ✅ Correct - fetch in useEffect
useEffect(() => {
  fetch('/api').then(setData);
}, []);
```

## Performance Debugging Checklist

1. **Identify the Problem**
   - Use React DevTools Profiler to record interactions
   - Look for components with long render times
   - Check for unnecessary re-renders (highlighted in Profiler)

2. **Check State Location**
   - Is state at the highest possible level?
   - Can you move state down to a smaller component?
   - Can you use children/component as props pattern?

3. **Review Memoization**
   - Are you memoizing props on non-memoized components?
   - Are ALL props on React.memo components memoized?
   - Are children memoized when needed?

4. **Check for Anti-Patterns**
   - Components defined inside components?
   - Inline object/array creation in render?
   - Spreading props through multiple levels?
   - Using index as key in dynamic lists?

5. **Data Fetching**
   - Any request waterfalls?
   - Are requests fired in parallel when possible?
   - Are race conditions handled?

## Quick Reference

### Re-render Triggers
- State update in component
- Parent component re-renders
- Context value changes (for consumers)

### Re-render Prevention
- React.memo (with properly memoized props)
- Children as props pattern
- Component as props pattern
- Moving state down

### Safe Memoization Dependencies
- Primitive values (string, number, boolean)
- Refs (ref itself, not ref.current)
- Memoized values (useMemo/useCallback with proper deps)
- Functions from Context with stable references

### Unsafe for Dependencies
- Objects/arrays created inline
- Functions created in render
- Props from other components (unless memoized)
- Values from custom hooks (unless memoized)

## When to Read References

See `references/reconciliation-deep-dive.md` for detailed information about:
- How React's diffing algorithm works
- Keys and reconciliation in depth
- State reset techniques

See `references/advanced-patterns.md` for:
- Higher-order components
- Render props patterns
- Portal usage patterns
- useLayoutEffect vs useEffect details
