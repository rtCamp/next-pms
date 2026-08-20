# React Reconciliation Deep Dive

## How Reconciliation Works

React compares elements between re-renders to determine what needs to update in the DOM.

### Element Comparison Rules

1. **Same position, same type** → Re-render the element
2. **Same position, different type** → Unmount old, mount new
3. **Different position with key** → React uses key to identify and reuse

### The Element Object

When you write `<Component />`, React creates an object:

```javascript
{
  type: Component, // or "div" for DOM elements
  props: { /* ... */ },
  key: null,
  // ... other internal React properties
}
```

React compares these objects using `Object.is()` for the element itself and the type property.

## Arrays and Reconciliation

### Without Keys

React compares array elements by position:

```jsx
// Before
[
  { type: Input },  // position 0
  { type: Input },  // position 1
]

// After
[
  { type: Input },  // position 0 - reused
  { type: Input },  // position 1 - reused
  { type: Input },  // position 2 - mounted
]
```

### With Keys

React compares by key, not position:

```jsx
// Before
[
  { type: Input, key: 'a' },
  { type: Input, key: 'b' },
]

// After (reordered)
[
  { type: Input, key: 'b' }, // React finds existing 'b', moves it
  { type: Input, key: 'a' }, // React finds existing 'a', moves it
]
```

## Keys Best Practices

### Use Stable, Unique IDs

```jsx
// ✅ Good - stable IDs from data
items.map(item => <Item key={item.id} {...item} />)

// ❌ Bad - index changes with reordering
items.map((item, i) => <Item key={i} {...item} />)

// ❌ Bad - random keys remount everything
items.map(item => <Item key={Math.random()} {...item} />)
```

### Keys with React.memo

For memoized dynamic lists, keys are crucial for performance:

```jsx
const ItemMemo = React.memo(Item);

// ❌ Bad - with index, reordering causes unnecessary re-renders
const items = sortedData.map((item, i) => (
  <ItemMemo key={i} {...item} />
));

// ✅ Good - with ID, React reuses memoized instances
const items = sortedData.map(item => (
  <ItemMemo key={item.id} {...item} />
));
```

## State Reset with Keys

Use keys to force React to unmount and remount:

```jsx
const Form = () => {
  const [mode, setMode] = useState('login');
  
  // Different keys force separate component instances
  return mode === 'login' 
    ? <AuthForm key="login" mode="login" />
    : <AuthForm key="signup" mode="signup" />;
};
```

Common use cases:
- Reset form state when switching between modes
- Reset component state on route changes
- Force fresh data fetch

```jsx
// Reset on URL change
<Component key={router.pathname} />

// Reset on user change
<UserProfile key={userId} userId={userId} />
```

## Conditional Rendering Impact

### Renders Same Component Type

```jsx
// Both branches render Input - React reuses the instance
{condition ? (
  <Input id="a" />
) : (
  <Input id="b" />
)}
```

State persists! Input doesn't unmount. To fix:

```jsx
// Add keys to treat as different instances
{condition ? (
  <Input key="a" id="a" />
) : (
  <Input key="b" id="b" />
)}
```

### Renders Different Components

```jsx
// Different types - React unmounts and remounts
{condition ? <Input /> : <TextArea />}
```

State is destroyed automatically.

## Components in Render Tree

### Position Matters

```jsx
const Parent = () => {
  const [show, setShow] = useState(false);
  
  return (
    <>
      <Child1 />
      {show && <Child2 />}
      <Child3 />
    </>
  );
};
```

Array structure:
- Position 0: Child1 (stable)
- Position 1: Child2 (conditional) or Child3
- Position 2: Child3 (if Child2 shown)

When `show` changes, Child3 position changes. Without keys, can cause issues.

### Fragments and Arrays

```jsx
// These are equivalent
<>
  <A />
  <B />
</>

// Becomes an array internally
[<A />, <B />]
```

## Common Reconciliation Bugs

### 1. Component Defined Inside Component

```jsx
// ❌ Bug: Child remounts every render
const Parent = () => {
  const Child = () => <div>Hi</div>;
  return <Child />;
};
```

Why: New function reference each render → type changes → unmount/mount.

### 2. Inline Element Creation

```jsx
// ❌ Bug: child prop always "changes"
<Parent child={<Child />} />
```

Fix: Memoize or move outside render.

### 3. Index as Key in Dynamic Lists

```jsx
// ❌ Bug: wrong items update when list changes
{items.map((item, i) => <Item key={i} {...item} />)}
```

### 4. Missing Keys with Multiple Conditional Elements

```jsx
// ❌ Bug: can cause state mixing
{showA && <ComponentA />}
{showB && <ComponentB />}
```

If both ComponentA and ComponentB are same type, React might reuse instance when toggling.

Fix: Add keys when conditionally rendering same component type multiple times.
