const DEFAULT_SITE_URL = "http://localhost:3001";

export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // Fall through to localhost default when env value is invalid.
    }
  }

  return new URL(DEFAULT_SITE_URL);
}

export function absoluteUrl(path: string): URL {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getSiteUrl());
}
