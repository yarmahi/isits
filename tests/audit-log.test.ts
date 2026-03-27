import { describe, expect, it } from "vitest";
import { parseUserAgent, sanitizeSnapshot } from "@/lib/audit-log";

describe("sanitizeSnapshot", () => {
  it("strips sensitive keys", () => {
    const out = sanitizeSnapshot({
      name: "ok",
      password: "secret",
    });
    expect(out?.name).toBe("ok");
    expect(out).not.toHaveProperty("password");
  });
});

describe("parseUserAgent", () => {
  it("detects Chrome on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const p = parseUserAgent(ua);
    expect(p.browserName).toBe("Chrome");
    expect(p.osName).toBe("Windows");
    expect(p.deviceType).toBe("desktop");
  });
});
