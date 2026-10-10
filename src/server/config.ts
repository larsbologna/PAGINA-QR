import "server-only";

function intEnv(name: string, fallback: number): number {
  const v = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const config = {
  get productName() {
    return process.env.PRODUCT_NAME?.trim() || "Reputación OS";
  },
  get providerName() {
    return process.env.PROVIDER_NAME?.trim() || "El proveedor del servicio";
  },
  get providerEmail() {
    return process.env.PROVIDER_CONTACT_EMAIL?.trim() || "";
  },
  get appUrl() {
    return (process.env.APP_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  },
  get appSecret() {
    const s = process.env.APP_SECRET;
    if (!s || s.length < 16) {
      if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET no configurado o demasiado corto.");
      return "dev-secret-no-usar-en-produccion";
    }
    return s;
  },
  get trustProxy() {
    return process.env.TRUST_PROXY === "true";
  },
  get secureCookies() {
    return this.appUrl.startsWith("https://");
  },
  get sessionDays() {
    return intEnv("SESSION_DAYS", 14);
  },
  get feedbackPerHour() {
    return intEnv("RATE_LIMIT_FEEDBACK_PER_HOUR", 10);
  },
  get loginPer15Min() {
    return intEnv("RATE_LIMIT_LOGIN_PER_15MIN", 10);
  },
};

export function publicFeedbackUrl(slug: string): string {
  return `${config.appUrl}/r/${slug}`;
}
