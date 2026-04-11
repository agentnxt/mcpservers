export class RustFSClient {
  private consoleUrl: string;
  private accessKey: string;
  private secretKey: string;
  private sessionToken: string | null = null;

  constructor(consoleUrl: string, accessKey: string, secretKey: string) {
    this.consoleUrl = consoleUrl.replace(/\/$/, "");
    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }

  private async login(): Promise<string> {
    if (this.sessionToken) return this.sessionToken;
    const res = await fetch(`${this.consoleUrl}/api/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessKey: this.accessKey, secretKey: this.secretKey }),
    });
    if (!res.ok) {
      throw new Error(`RustFS login failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json() as Record<string, string>;
    this.sessionToken = data.sessionId || data.token || null;
    if (!this.sessionToken) {
      const cookie = res.headers.get("set-cookie");
      if (cookie) this.sessionToken = cookie;
    }
    if (!this.sessionToken) {
      throw new Error("RustFS login: no session token received");
    }
    return this.sessionToken;
  }

  private authHeaders(token: string): Record<string, string> {
    if (token.includes("=")) {
      return { Cookie: token };
    }
    return { Authorization: `Bearer ${token}` };
  }

  async fetch(path: string, options: RequestInit = {}): Promise<unknown> {
    const token = await this.login();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
      ...this.authHeaders(token),
    };
    const res = await fetch(`${this.consoleUrl}${path}`, { ...options, headers });
    if (res.status === 401) {
      this.sessionToken = null;
      const newToken = await this.login();
      const retryHeaders = { ...headers, ...this.authHeaders(newToken) };
      const retry = await fetch(`${this.consoleUrl}${path}`, { ...options, headers: retryHeaders });
      if (!retry.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${retry.status} ${await retry.text()}`);
      const text = await retry.text();
      return text ? JSON.parse(text) : {};
    }
    if (!res.ok) throw new Error(`${options.method || "GET"} ${path} failed: ${res.status} ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }
}
