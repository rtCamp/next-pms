# GenWrapper

`GenWrapper`, short for "General Wrapper," is a versatile component designed to wrap other components, enabling you to add checksums, additional logic, and error handling with ease.

---

# ErrorBoundary

The `ErrorBoundary` component is essential for handling errors that are not caused by events or asynchronous operations. Typically, it wraps around child components and accepts a `fallback` prop, which specifies the UI to display if an error occurs in the child component.

> **Note:** `ErrorBoundary` can only be used with valid React components, not with JSX or HTML elements.

---

# DefaultErrorFallBack

`DefaultErrorFallBack` serves as the default fallback UI for `ErrorBoundary`. It can be customized as needed to fit the specific error handling requirements of your application.
