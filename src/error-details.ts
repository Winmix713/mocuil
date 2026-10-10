export interface ErrorDetails { message: string; code?: string; details?: string; hint?: string }

export function readErrorDetails(error: unknown, fallback: string): ErrorDetails {
  if (!error || typeof error !== "object") return { message: typeof error === "string" && error.trim() ? error : fallback };
  const value = error as Record<string, unknown>;
  const text = (key: string) => typeof value[key] === "string" && value[key].trim() ? value[key] : undefined;
  return { message: text("message") ?? fallback, code: text("code"), details: text("details"), hint: text("hint") };
}
