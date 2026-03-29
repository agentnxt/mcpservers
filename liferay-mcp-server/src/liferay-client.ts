import { generateBasicAuthHeader } from "./auth.js";

export class LiferayClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(baseUrl: string, username: string, password: string) {
    // Strip trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.authHeader = generateBasicAuthHeader(username, password);
  }

  private headers(): Record<string, string> {
    return {
      Authorization: this.authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private endpoint(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  async get(
    path: string,
    params?: Record<string, string>
  ): Promise<unknown> {
    const res = await fetch(this.endpoint(path, params), {
      method: "GET",
      headers: this.headers(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Liferay API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  async post(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(this.endpoint(path), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Liferay API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  async put(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(this.endpoint(path), {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Liferay API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  async delete(path: string): Promise<unknown> {
    const res = await fetch(this.endpoint(path), {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Liferay API error ${res.status}: ${text}`);
    }
    // DELETE often returns 204 No Content
    if (res.status === 204) {
      return { success: true };
    }
    return res.json();
  }
}
