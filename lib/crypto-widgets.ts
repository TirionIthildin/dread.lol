/**
 * Crypto spot price widget: CoinGecko-backed, allowlisted coin ids only.
 */

export const MAX_CRYPTO_WIDGET_COINS = 6;

/** CoinGecko `id` values users may select (public API simple/price). */
export const ALLOWED_CRYPTO_IDS: readonly string[] = [
  "bitcoin",
  "ethereum",
  "solana",
  "cardano",
  "ripple",
  "dogecoin",
  "polkadot",
  "avalanche-2",
  "chainlink",
  "polygon-ecosystem-token",
  "litecoin",
  "bitcoin-cash",
  "uniswap",
  "cosmos",
  "near",
  "aptos",
  "arbitrum",
  "optimism",
  "the-open-network",
  "shiba-inu",
] as const;

const ALLOWED_SET = new Set<string>(ALLOWED_CRYPTO_IDS);

/** Display labels; CoinGecko id -> friendly name + ticker symbol. */
export const CRYPTO_DISPLAY: Record<string, { name: string; symbol: string }> = {
  bitcoin: { name: "Bitcoin", symbol: "BTC" },
  ethereum: { name: "Ethereum", symbol: "ETH" },
  solana: { name: "Solana", symbol: "SOL" },
  cardano: { name: "Cardano", symbol: "ADA" },
  ripple: { name: "XRP", symbol: "XRP" },
  dogecoin: { name: "Dogecoin", symbol: "DOGE" },
  polkadot: { name: "Polkadot", symbol: "DOT" },
  "avalanche-2": { name: "Avalanche", symbol: "AVAX" },
  chainlink: { name: "Chainlink", symbol: "LINK" },
  "polygon-ecosystem-token": { name: "Polygon", symbol: "POL" },
  litecoin: { name: "Litecoin", symbol: "LTC" },
  "bitcoin-cash": { name: "Bitcoin Cash", symbol: "BCH" },
  uniswap: { name: "Uniswap", symbol: "UNI" },
  cosmos: { name: "Cosmos", symbol: "ATOM" },
  near: { name: "NEAR", symbol: "NEAR" },
  aptos: { name: "Aptos", symbol: "APT" },
  arbitrum: { name: "Arbitrum", symbol: "ARB" },
  optimism: { name: "Optimism", symbol: "OP" },
  "the-open-network": { name: "Toncoin", symbol: "TON" },
  "shiba-inu": { name: "Shiba Inu", symbol: "SHIB" },
};

export interface CryptoWidgetData {
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    priceUsd: number;
    change24hPct: number | null;
  }>;
}

/**
 * Parse CSV of coin ids from DB: lowercase, dedupe, allowlist only, preserve first-seen order, max 6.
 */
export function parseEnabledCryptoIds(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (!id || !ALLOWED_SET.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_CRYPTO_WIDGET_COINS) break;
  }
  return out;
}

function displayForId(id: string): { name: string; symbol: string } {
  const meta = CRYPTO_DISPLAY[id];
  if (meta) return meta;
  const title = id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { name: title, symbol: id.slice(0, 6).toUpperCase() };
}

type SimplePriceResponse = Record<string, { usd?: number; usd_24h_change?: number | null }>;

/**
 * Fetch USD spot + 24h change from CoinGecko (server-only; cached via Next fetch).
 * @param raw - Comma-separated ids from `showCryptoWidgets` (or pre-parsed via `parseEnabledCryptoIds`).
 */
export async function getCryptoWidgetData(raw: string | null | undefined): Promise<CryptoWidgetData | null> {
  const clean = parseEnabledCryptoIds(raw);
  if (clean.length === 0) return null;

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", clean.join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      next: { revalidate: 120 },
      headers: { Accept: "application/json" },
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return null;
  }

  if (!json || typeof json !== "object") return null;
  const data = json as SimplePriceResponse;

  const coins: CryptoWidgetData["coins"] = [];
  for (const id of clean) {
    const row = data[id];
    if (!row || typeof row.usd !== "number" || !Number.isFinite(row.usd)) continue;
    const { name, symbol } = displayForId(id);
    const change =
      row.usd_24h_change != null && Number.isFinite(row.usd_24h_change) ? row.usd_24h_change : null;
    coins.push({
      id,
      name,
      symbol,
      priceUsd: row.usd,
      change24hPct: change,
    });
  }

  return coins.length > 0 ? { coins } : null;
}
