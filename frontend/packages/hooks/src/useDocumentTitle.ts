/**
 * External dependencies
 */
import { useEffect } from "react";

const BASE_TITLE = "Next PMS";

export const useDocumentTitle = (title?: string, withBaseTitle = true) => {
  useEffect(() => {
    if (!title) return;
    document.title = withBaseTitle ? `${title} | ${BASE_TITLE}` : title;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title, withBaseTitle]);
};
