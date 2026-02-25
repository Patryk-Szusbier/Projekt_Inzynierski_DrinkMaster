import * as Network from "expo-network";
import * as SecureStore from "expo-secure-store";

const API_URL_STORAGE_KEY = "drinkmaster_api_base_url";
const HEALTH_PATH = "/health";
const DEFAULT_PORT = "8000";

// Runtime URL should come from discovery, not from a static env value.
let runtimeApiBaseUrl = "";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function withTimeout(ms: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller;
}

async function isHealthy(baseUrl: string, timeoutMs = 1200): Promise<boolean> {
  const url = `${normalizeBaseUrl(baseUrl)}${HEALTH_PATH}`;
  const controller = withTimeout(timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean } | null;
    return data?.ok === true;
  } catch {
    return false;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean).map(normalizeBaseUrl))];
}

function extractSubnetPrefix(ip: string): string | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => Number(p));
  if (octets.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return `${octets[0]}.${octets[1]}.${octets[2]}`;
}

function buildSubnetCandidates(prefix: string, ownIp: string): string[] {
  const ownLast = Number(ownIp.split(".")[3]);
  const priorityHosts = [1, 2, 10, 20, 50, 100, 101, 108, 150, 200, 254];

  const hosts: number[] = [];
  for (const host of priorityHosts) {
    if (host !== ownLast && host >= 1 && host <= 254) hosts.push(host);
  }
  for (let host = 1; host <= 254; host++) {
    if (host === ownLast || hosts.includes(host)) continue;
    hosts.push(host);
  }

  return hosts.map((h) => `http://${prefix}.${h}:${DEFAULT_PORT}`);
}

function buildPriorityCandidates(prefix: string): string[] {
  const priorityHosts = [1, 2, 10, 20, 50, 100, 101, 108, 150, 200, 254];
  return priorityHosts.map((h) => `http://${prefix}.${h}:${DEFAULT_PORT}`);
}

function buildFullPrefixCandidates(prefix: string): string[] {
  const hosts: string[] = [];
  for (let h = 1; h <= 254; h++) {
    hosts.push(`http://${prefix}.${h}:${DEFAULT_PORT}`);
  }
  return hosts;
}

async function firstHealthy(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    if (await isHealthy(candidate, 900)) return normalizeBaseUrl(candidate);
  }
  return null;
}

async function scanSubnet(candidates: string[]): Promise<string | null> {
  const workerCount = 24;
  let found: string | null = null;
  let nextIndex = 0;

  async function worker() {
    while (!found) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= candidates.length) return;

      const candidate = candidates[current];
      if (await isHealthy(candidate, 700)) {
        found = normalizeBaseUrl(candidate);
        return;
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return found;
}

export function getApiBaseUrl(): string {
  return normalizeBaseUrl(runtimeApiBaseUrl);
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function setApiBaseUrl(
  baseUrl: string,
  persist = true
): Promise<string> {
  const normalized = normalizeBaseUrl(baseUrl);
  runtimeApiBaseUrl = normalized;
  if (persist) {
    await SecureStore.setItemAsync(API_URL_STORAGE_KEY, normalized);
  }
  return normalized;
}

export async function ensureApiBaseUrl(force = false): Promise<string> {
  if (!force && runtimeApiBaseUrl && (await isHealthy(runtimeApiBaseUrl, 900))) {
    return normalizeBaseUrl(runtimeApiBaseUrl);
  }

  const saved = await SecureStore.getItemAsync(API_URL_STORAGE_KEY);
  const directCandidates = unique([
    saved || "",
    process.env.EXPO_PUBLIC_API_URL || "",
    `http://raspberrypi.local:${DEFAULT_PORT}`,
    `http://drinkmaster.local:${DEFAULT_PORT}`,
  ]);

  const directFound = await firstHealthy(directCandidates);
  if (directFound) return setApiBaseUrl(directFound);

  try {
    const ip = await Network.getIpAddressAsync();
    const prefix = extractSubnetPrefix(ip);
    if (prefix) {
      // Quick scan across likely hosts first.
      const quick = await firstHealthy(buildPriorityCandidates(prefix));
      if (quick) return setApiBaseUrl(quick);

      // Then full subnet scan.
      const subnetCandidates = buildSubnetCandidates(prefix, ip);
      const scanned = await scanSubnet(subnetCandidates);
      if (scanned) return setApiBaseUrl(scanned);
    }
  } catch {
    // Ignore network detection errors and throw below.
  }

  // Fallback when Android returns non-IPv4 or unreliable local address.
  const commonPrefixes = [
    "192.168.0",
    "192.168.1",
    "192.168.2",
    "192.168.8",
    "192.168.31",
    "192.168.50",
    "192.168.43",
    "10.0.0",
    "10.0.1",
    "10.1.1",
  ];
  const quickCommonCandidates = unique(commonPrefixes.flatMap(buildPriorityCandidates));
  const commonFound = await firstHealthy(quickCommonCandidates);
  if (commonFound) return setApiBaseUrl(commonFound);

  // Last resort: full scans of popular private subnets.
  for (const prefix of commonPrefixes) {
    const fullCandidates = buildFullPrefixCandidates(prefix);
    const found = await scanSubnet(fullCandidates);
    if (found) return setApiBaseUrl(found);
  }

  throw new Error(
    "Nie znaleziono serwera DrinkMaster w lokalnej sieci. " +
      "Upewnij sie, ze backend dziala i telefon jest w tej samej sieci Wi-Fi."
  );
}
