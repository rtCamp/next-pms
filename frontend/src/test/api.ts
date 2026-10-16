import { vi } from "vitest";

export interface ApiRequest {
  /** The path after `/api/v2/method/` or `/api/v2/`, e.g. `"frappe.client.get_list"`. */
  path: string;
  method: string;
  /** Query params of a GET, or the JSON body of a POST. */
  params: Record<string, unknown>;
}

/** A failed call, answered as Frappe does: HTTP 417 with an `errors` list. */
export class ApiError {
  constructor(
    readonly message: string,
    readonly type = "ValidationError",
  ) {}
}

type Handler = (request: ApiRequest) => unknown;

function pathOf(url: URL) {
  return decodeURIComponent(url.pathname).replace(
    /^\/api\/v2\/(method\/)?/,
    "",
  );
}

/**
 * Answers frappe-ui's requests from `handlers`, keyed by path. A handler returns the
 * response's `data`, a promise of it, or an `ApiError`; unknown paths fail the test.
 */
export function mockApi(handlers: Record<string, Handler>) {
  const requests: ApiRequest[] = [];
  const spy = vi
    .spyOn(window, "fetch")
    .mockImplementation(async (input, init) => {
      const url = new URL(String(input), window.location.origin);
      const method = (init?.method ?? "GET").toUpperCase();
      const params: Record<string, unknown> = {};
      if (method === "GET") {
        url.searchParams.forEach((value, key) => (params[key] = value));
      } else {
        Object.assign(params, JSON.parse(String(init?.body ?? "{}")));
      }
      const request = { path: pathOf(url), method, params };
      requests.push(request);
      const handler = handlers[request.path];
      if (!handler) throw new Error(`No mock for ${method} ${request.path}`);
      const result = await handler(request);
      if (result instanceof ApiError) {
        return new Response(
          JSON.stringify({
            errors: [
              { type: result.type, message: result.message, title: "Error" },
            ],
          }),
          { status: 417 },
        );
      }
      return new Response(JSON.stringify({ data: result ?? null }));
    });
  return {
    requests,
    /** The requests made to `path`. */
    requestsTo: (path: string) => requests.filter((r) => r.path === path),
    restore: () => spy.mockRestore(),
  };
}

/** A promise with its `resolve`, to hold a response until the test releases it. */
export function deferred<T = unknown>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
}
