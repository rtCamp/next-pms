/**
 * External dependencies.
 */
import { matchPath } from "react-router-dom";
/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { routeConfig } from "@/route";

type ConfiguredRouteKey = keyof typeof routeConfig;

/**
 * Find the lazy component registered for a given path, matching against the
 * configured route patterns the same way the router does.
 */
const findComponentForRoute = (path: string) => {
  const key = (Object.keys(routeConfig) as ConfiguredRouteKey[]).find(
    (routeKey) => matchPath(ROUTES[routeKey], path),
  );

  return key ? routeConfig[key].Component : undefined;
};

/**
 * Preload the chunk for the view a path resolves to, so it is already in cache
 * by the time the user navigates there.
 */
export const preloadRouteComponent = (path: string) => {
  findComponentForRoute(path)?.preload();
};
