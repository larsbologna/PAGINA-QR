export class AppError extends Error {
  constructor(
    public code: "NOT_FOUND" | "FORBIDDEN" | "UNAUTHENTICATED" | "VALIDATION" | "RATE_LIMITED" | "CONFLICT" | "UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const HTTP_STATUS: Record<AppError["code"], number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  UNAUTHENTICATED: 401,
  VALIDATION: 400,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  UNAVAILABLE: 410,
};
