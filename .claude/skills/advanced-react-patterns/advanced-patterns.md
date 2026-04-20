# Advanced React Patterns Reference

## Higher-Order Components (HOCs)

### Pattern Definition

A function that accepts a component and returns a new component with enhanced functionality.

```jsx
const withSomething = (Component) => {
  return (props) => {
    // Add logic here
    return <Component {...props} extraProp={value} />;
  };
};

// Usage
const EnhancedComponent = withSomething(BaseComponent);
```

### Enhancing Callbacks

```jsx
const withLogging = (Component) => {
  return (props) => {
    const onClick = () => {
      console.log('Clicked!');
      props.onClick?.();
    };
    
    return <Component {...props} onClick={onClick} />;
  };
};

// Works with any component with onClick
const ButtonWithLogging = withLogging(Button);
const LinkWithLogging = withLogging(Link);
```

### Injecting Data

```jsx
const withTheme = (Component) => {
  return (props) => {
    const theme = useTheme(); // Get from context or elsewhere
    return <Component {...props} theme={theme} />;
  };
};
```

### Passing Additional Config

```jsx
// Accept config as second parameter
const withLogging = (Component, logMessage) => {
  return (props) => {
    const onClick = () => {
      console.log(logMessage);
      props.onClick?.();
    };
    return <Component {...props} onClick={onClick} />;
  };
};

const Button = withLogging(BaseButton, 'Button clicked');
```

### Intercepting Events

```jsx
const withKeyboardShortcuts = (Component) => {
  return (props) => {
    const onKeyPress = (e) => {
      e.stopPropagation();
      props.onKeyPress?.(e);
    };
    
    return (
      <div onKeyPress={onKeyPress}>
        <Component {...props} />
      </div>
    );
  };
};
```

## Render Props Pattern

### Basic Pattern

Pass a function as children that returns elements:

```jsx
const DataProvider = ({ children }) => {
  const [data, setData] = useState();
  
  // Call the function, passing data
  return children(data);
};

// Usage
<DataProvider>
  {(data) => <Display data={data} />}
</DataProvider>
```

### Sharing Stateful Logic

```jsx
const MouseTracker = ({ children }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const onMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };
  
  return (
    <div onMouseMove={onMouseMove}>
      {children(position)}
    </div>
  );
};

// Usage
<MouseTracker>
  {({ x, y }) => (
    <p>Mouse at {x}, {y}</p>
  )}
</MouseTracker>
```

### Configuration with Render Props

```jsx
const Button = ({ renderIcon }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconProps = {
    size: isHovered ? 'large' : 'medium',
    color: 'blue'
  };
  
  return (
    <button 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderIcon(iconProps, { isHovered })}
    </button>
  );
};

// Usage - full control over icon
<Button renderIcon={(props, state) => (
  <Icon {...props} animate={state.isHovered} />
)} />
```

### When to Use vs Hooks

**Use Hooks when:**
- Logic doesn't depend on DOM element
- You want simpler API
- Logic is reused across many components

**Use Render Props when:**
- Logic depends on specific DOM element
- You need maximum flexibility
- Component needs to control rendering

Example where render props are better:

```jsx
// Scroll detection needs a specific div
const ScrollDetector = ({ children }) => {
  const [scroll, setScroll] = useState(0);
  
  return (
    <div onScroll={(e) => setScroll(e.currentTarget.scrollTop)}>
      {children(scroll)}
    </div>
  );
};
```

## React Portal Patterns

### Basic Portal Usage

```jsx
const Modal = ({ children }) => {
  return ReactDOM.createPortal(
    children,
    document.getElementById('modal-root')
  );
};
```

### Portal with Backdrop

```jsx
const Modal = ({ onClose, children }) => {
  return ReactDOM.createPortal(
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal">{children}</div>
    </>,
    document.getElementById('modal-root')
  );
};
```

### Escaping Stacking Context

Use portals when element needs to appear on top but is deep in component tree:

```jsx
const DropdownMenu = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </button>
      {isOpen && ReactDOM.createPortal(
        <div className="dropdown">{children}</div>,
        document.body // Render at root to escape stacking context
      )}
    </>
  );
};
```

### Important Portal Caveats

1. **React Events Work Normally**
   - Click events bubble through React tree, not DOM tree
   - Event handlers in parent components will catch events

2. **Native Events Follow DOM**
   - `element.addEventListener` follows DOM structure
   - Portal content is in different DOM location

3. **Form Submission**
   - `onSubmit` is native, not synthetic
   - Portal content is outside form in DOM
   - Form must be inside portal for submit to work

4. **CSS Inheritance Breaks**
   - Portalled content doesn't inherit styles from DOM parents
   - Must apply styles directly or use global styles

## useLayoutEffect vs useEffect

### useEffect Flow

```
1. Component renders
2. Browser paints to screen
3. useEffect runs
```

User can see intermediate state before effect runs.

### useLayoutEffect Flow

```
1. Component renders
2. useLayoutEffect runs (synchronously)
3. Browser paints to screen
```

Browser waits for effect before painting.

### When to Use useLayoutEffect

**Use for:**
- Measuring DOM elements (getBoundingClientRect)
- Adjusting layout based on measurements
- Preventing visual "flicker"
- Animations that need to start immediately

```jsx
const Component = () => {
  const ref = useRef();
  const [height, setHeight] = useState(0);
  
  useLayoutEffect(() => {
    // Measure before paint
    const height = ref.current.offsetHeight;
    setHeight(height);
  }, []);
  
  return <div ref={ref}>Content</div>;
};
```

**Don't use for:**
- Data fetching
- Subscriptions
- Event listeners
- Anything that doesn't need to block paint

### Performance Warning

useLayoutEffect is synchronous and blocks painting. Slow effects will make the page feel unresponsive.

Only use when you need to prevent visual flicker. useEffect is better for performance in 99% of cases.

### SSR Considerations

useLayoutEffect doesn't run on server. Will get warning if rendered server-side.

Fix by conditionally using it:

```jsx
const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
```

Or show different content on server:

```jsx
const Component = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) return <Fallback />;
  
  return <ActualComponent />;
};
```

## Imperative Patterns with Refs

### forwardRef Pattern

```jsx
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Parent can access input DOM
const Parent = () => {
  const inputRef = useRef();
  
  const focusInput = () => {
    inputRef.current.focus();
  };
  
  return <Input ref={inputRef} />;
};
```

### useImperativeHandle Pattern

Create custom imperative API:

```jsx
const Input = forwardRef((props, ref) => {
  const [value, setValue] = useState('');
  const inputRef = useRef();
  
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => setValue(''),
    getValue: () => value
  }));
  
  return (
    <input 
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
});

// Parent uses custom API
const Parent = () => {
  const inputRef = useRef();
  
  return (
    <>
      <Input ref={inputRef} />
      <button onClick={() => inputRef.current.clear()}>
        Clear
      </button>
    </>
  );
};
```

### Alternative Without useImperativeHandle

```jsx
const Input = ({ apiRef }) => {
  const inputRef = useRef();
  
  useEffect(() => {
    apiRef.current = {
      focus: () => inputRef.current.focus(),
      clear: () => inputRef.current.value = ''
    };
  });
  
  return <input ref={inputRef} />;
};
```

## Stacking Context Escape Patterns

### Problem: CSS Position and Z-Index

```jsx
// This modal might appear under header
const Page = () => {
  return (
    <>
      <Header style={{ position: 'sticky', zIndex: 10 }} />
      <Content>
        <Modal /> {/* Might be trapped under header */}
      </Content>
    </>
  );
};
```

### Solution 1: Portal

```jsx
const Modal = () => {
  return ReactDOM.createPortal(
    <div className="modal">Content</div>,
    document.body // Escape component hierarchy
  );
};
```

### Solution 2: Fixed Position Carefully

```jsx
// Ensure no parent has transform
const Modal = () => {
  return (
    <div style={{ 
      position: 'fixed',
      zIndex: 9999,
      top: 0,
      left: 0
    }}>
      Content
    </div>
  );
};
```

### Common Stacking Context Triggers

- `position: relative/absolute/fixed` + `z-index`
- `transform` (even `transform: translateZ(0)`)
- `opacity` < 1
- `filter`
- `will-change`

Always check parent chain for these properties when positioning fails.
