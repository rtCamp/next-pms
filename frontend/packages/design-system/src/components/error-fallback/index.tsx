/**
 * External dependencies
 */
import React, { Component, ReactNode } from "react";
/**
 * Internal dependencies
 */
import { default as Typography } from "../typography";

type ErrorFallbackProp = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorFallbackState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * React still requires a class component for a true error boundary.
 * Function components cannot implement getDerivedStateFromError or componentDidCatch.
 */
class ErrorFallback extends Component<ErrorFallbackProp, ErrorFallbackState> {
  state: ErrorFallbackState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorFallbackState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    return hasError
      ? fallback || (
          <div className="w-full h-full flex flex-col gap-1 justify-center items-center">
            <Typography variant="p" className="text-ink-gray-7 font-medium">
              Something went wrong
            </Typography>
            {error?.message ? (
              <Typography
                variant="p"
                className="wrap-break-word text-sm text-ink-gray-5"
              >
                {error.message}
              </Typography>
            ) : null}
          </div>
        )
      : children;
  }
}

export default ErrorFallback;
