import { afterEach, describe, expect, it, vi } from "vitest";
import { getBetterAuthBaseUrl, getServerEnv } from "@/lib/env";

describe("getServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns DATABASE_URL when set", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    expect(getServerEnv().DATABASE_URL).toBe("postgresql://localhost:5432/test");
  });
});

describe("getBetterAuthBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses BETTER_AUTH_URL when set", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://app.example.com");
    expect(getBetterAuthBaseUrl()).toBe("https://app.example.com");
  });
});
