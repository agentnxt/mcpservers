export type AuthConfig =
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "header"; name: string; value: string }
  | { type: "query"; params: Record<string, string> }
  | { type: "none" };

export class HttpClient {
  constructor(
    private baseUrl: string,
    private auth: AuthConfig = { type: "none" }
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.auth.type === "bearer") {
      headers["Authorization"] = `Bearer ${this.auth.token}`;
    } else if (this.auth.type === "basic") {
      headers["Authorization"] = `Basic ${Buffer.from(`${this.auth.username}:${this.auth.password}`).toString("base64")}`;
    } else if (this.auth.type === "header") {
      headers[this.auth.name] = this.auth.value;
    }
    return headers;
  }

  private appendQueryAuth(url: string): string {
    if (this.auth.type === "query") {
      const u = new URL(url);
      for (const [k, v] of Object.entries(this.auth.params)) {
        u.searchParams.set(k, v);
      }
      return u.toString();
    }
    return url;
  }

  async get(path: string, params?: Record<string, string>): Promise<any> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const u = new URL(url);
      for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
      url = u.toString();
    }
    url = this.appendQueryAuth(url);
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async post(path: string, body?: any): Promise<any> {
    const url = this.appendQueryAuth(`${this.baseUrl}${path}`);
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  async put(path: string, body?: any): Promise<any> {
    const url = this.appendQueryAuth(`${this.baseUrl}${path}`);
    const res = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(),
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  async delete(path: string): Promise<any> {
    const url = this.appendQueryAuth(`${this.baseUrl}${path}`);
    const res = await fetch(url, { method: "DELETE", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status} ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }
}
