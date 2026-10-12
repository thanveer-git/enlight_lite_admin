export class ApiError extends Error {
  status: number;
  issues?: { field: string; message: string }[];

  constructor(
    status: number,
    message: string,
    issues?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

interface BackendFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function backendFetch<T = unknown>(
  path: string,
  options: BackendFetchOptions = {},
): Promise<T> {
  const { body, headers: extraHeaders, ...rest } = options;

  const res = await fetch(path, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extraHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    throw new ApiError(401, "Session expired — please log in again");
  }

  const json = await res.json();
  const meta = json.metadata ?? {};

  if (meta.error) {
    throw new ApiError(
      Number(meta.status_code ?? res.status),
      meta.message || "Request failed",
      meta.issues,
    );
  }

  return json.data as T;
}

export function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(v))}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}
