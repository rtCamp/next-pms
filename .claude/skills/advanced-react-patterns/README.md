# Advanced React Patterns

A comprehensive Claude Code skill for mastering React performance optimization, advanced patterns, and architectural best practices.

## Overview

This skill provides expert guidance on React development, covering everything from performance optimization to advanced composition patterns. It helps developers write efficient, maintainable React applications by following proven patterns and avoiding common anti-patterns.

## What's Included

### Core Skill (`SKILL.md`)
The main skill file provides comprehensive coverage of:
- **Performance Patterns**: State management, composition patterns, memoization strategies
- **Context Patterns**: Optimal Context usage and split provider patterns
- **Refs Patterns**: When to use refs vs state, escaping stale closures, debouncing
- **Data Fetching**: Parallel fetching, race condition prevention, provider patterns
- **Error Handling**: ErrorBoundary implementation and async error catching
- **Anti-Patterns**: Common mistakes and how to avoid them
- **Performance Debugging**: Step-by-step checklist for identifying and fixing issues

### Advanced Patterns Reference (`advanced-patterns.md`)
Additional patterns including:
- Higher-Order Components (HOCs)
- Render Props pattern
- React Portals and stacking context
- useLayoutEffect vs useEffect
- Imperative patterns with refs (forwardRef, useImperativeHandle)

### Reconciliation Deep Dive (`reconciliation-deep-dive.md`)
Understanding React's internals:
- How React's diffing algorithm works
- Keys and reconciliation mechanics
- State reset techniques
- Common reconciliation bugs and fixes

## Core Principles

### 1. Re-renders Are Not the Enemy
Re-renders are essential for interactivity. The goal is to optimize unnecessary re-renders, not eliminate all re-renders.

### 2. Composition Over Memoization
Always prefer composition patterns (moving state down, children as props, component as props) over React.memo/useMemo/useCallback. Memoization should be a last resort.

### 3. Measure Before Optimizing
Never assume performance problems. Use React DevTools Profiler and browser performance tools to identify actual bottlenecks before applying optimizations.

## Quick Start

### Using with Claude Code

1. Invoke the skill when working on React projects:
   - Performance optimization tasks
   - Debugging slow renders or re-render issues
   - Implementing complex state management
   - Working with memoization, Context, or data fetching
   - Need guidance on React best practices

2. The skill provides:
   - Pattern recommendations with code examples
   - Performance debugging workflows
   - Anti-pattern identification and fixes
   - Best practices for hooks, Context, and refs

### Key Topics Covered

#### Performance Optimization
- Moving state down to reduce re-render scope
- Children as props pattern
- Component as props pattern
- React.memo best practices
- useMemo and useCallback usage guidelines

#### Context Patterns
- Context value memoization
- Split providers for data and API
- Optimizing Context consumers

#### Data Fetching
- Parallel vs waterfall requests
- Race condition prevention with cleanup flags
- AbortController usage
- Data provider patterns

#### Error Handling
- ErrorBoundary implementation
- Catching async errors in error boundaries
- Error logging and fallback UI

#### Common Anti-Patterns
- Components defined inside components
- Unnecessary keys and index as key
- Inline object/array creation
- Fetching in render instead of useEffect

## Performance Debugging Workflow

1. **Identify the Problem**
   - Use React DevTools Profiler
   - Look for long render times and unnecessary re-renders

2. **Check State Location**
   - Can state be moved down?
   - Can you use children/component as props pattern?

3. **Review Memoization**
   - Are you memoizing props on non-memoized components?
   - Are ALL props on React.memo components memoized?

4. **Check for Anti-Patterns**
   - Components inside components?
   - Inline object creation?
   - Index as key?

5. **Data Fetching**
   - Request waterfalls?
   - Parallel loading opportunities?
   - Race condition handling?

## Examples

### Before: Unnecessary Re-renders
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

### After: State Moved Down
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

## When to Use Each Pattern

### Moving State Down
Use when: State only affects a small part of the component tree
Benefit: Limits re-render scope automatically

### Children as Props
Use when: Parent needs state but children should not re-render
Benefit: Children are created in parent's parent, avoiding re-renders

### Component as Props
Use when: Multiple parts of UI should not re-render with state changes
Benefit: Maximum flexibility with composition

### React.memo
Use when: Composition patterns don't work and you've measured performance issues
Critical: ALL props must be memoized or primitive

## Installation

### As a Claude Code Skill

Copy the skill files to your Claude Code skills directory:

```bash
# Copy skill to your skills directory
cp -r advanced-react-skill ~/.claude/skills/
```

The skill will be available for Claude Code to use when working on React projects.

### As Reference Documentation

Simply clone or reference the markdown files directly for quick pattern lookup:

- `SKILL.md` - Main patterns and best practices
- `advanced-patterns.md` - Advanced techniques
- `reconciliation-deep-dive.md` - React internals

## Contributing

This skill is designed for Claude Code but the patterns and techniques are applicable to any React project. Contributions that improve clarity, add new proven patterns, or update best practices are welcome.

## License

MIT

## Resources

- [React Documentation](https://react.dev)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [React Profiler](https://react.dev/reference/react/Profiler)

---

Built for use with [Claude Code](https://claude.com/claude-code) - Anthropic's official CLI for Claude.
