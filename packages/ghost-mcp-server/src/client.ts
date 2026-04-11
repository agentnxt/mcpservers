import crypto from "node:crypto";

export class GhostClient {
  private baseUrl: string;
  private keyId: string;
  private keySecret: string;

  constructor(baseUrl: string, adminKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    const [id, secret] = adminKey.split(":");
    if (!id || !secret) {
      throw new Error("GHOST_ADMIN_KEY must be in format {id}:{secret}");
    }
    this.keyId = id;
    this.keySecret = secret;
  }

  private base64url(buf: Buffer): string {
    return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }

  private createJwt(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "HS256", kid: this.keyId, typ: "JWT" };
    const payload = { iat: now, exp: now + 300, aud: "/admin/" };

    const headerB64 = this.base64url(Buffer.from(JSON.stringify(header)));
    const payloadB64 = this.base64url(Buffer.from(JSON.stringify(payload)));
    const signingInput = `${headerB64}.${payloadB64}`;

    const secretBuf = Buffer.from(this.keySecret, "hex");
    const signature = crypto.createHmac("sha256", secretBuf).update(signingInput).digest();

    return `${signingInput}.${this.base64url(signature)}`;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Ghost ${this.createJwt()}`,
    };
  }

  async get(path: string, params?: Record<string, string>): Promise<unknown> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const u = new URL(url);
      for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
      url = u.toString();
    }
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async post(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async put(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  async delete(path: string): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status} ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }
}
