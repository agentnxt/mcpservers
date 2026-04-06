export class CognitiveMemoryClient {
  readonly baseUrl: string;
  private apiKey: string;

  constructor(url: string, apiKey: string) {
    this.baseUrl = url.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private headers(): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private endpoint(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  async get(path: string, params?: Record<string, string>): Promise<unknown> {
    const url = new URL(this.endpoint(path));
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { headers: this.headers() });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async post(path: string, body?: unknown): Promise<unknown> {
    const res = await fetch(this.endpoint(path), {
      method: "POST",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async delete(path: string): Promise<unknown> {
    const res = await fetch(this.endpoint(path), {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }
}
