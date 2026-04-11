export function envRequired(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export function envOptional(name: string, fallback: string = ""): string {
  return process.env[name] || fallback;
}
