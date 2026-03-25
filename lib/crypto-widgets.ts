/**
 * Crypto wallet widget: native balance on Ethereum, Bitcoin, or Solana (public RPC / APIs).
 */

export const CRYPTO_WALLET_CHAINS = ["ethereum", "bitcoin", "solana"] as const;
export type CryptoWalletChain = (typeof CRYPTO_WALLET_CHAINS)[number];

const CHAIN_META: Record<CryptoWalletChain, { networkLabel: string; symbol: string; coingeckoId: string }> = {
  ethereum: { networkLabel: "Ethereum", symbol: "ETH", coingeckoId: "ethereum" },
  bitcoin: { networkLabel: "Bitcoin", symbol: "BTC", coingeckoId: "bitcoin" },
  solana: { networkLabel: "Solana", symbol: "SOL", coingeckoId: "solana" },
};

const FETCH_REVALIDATE = 120;

/** Max stored address length (schema). */
export const MAX_CRYPTO_WALLET_ADDRESS_LEN = 128;

function parseChain(raw: string | null | undefined): CryptoWalletChain | null {
  if (!raw?.trim()) return null;
  const c = raw.trim().toLowerCase();
  return CRYPTO_WALLET_CHAINS.includes(c as CryptoWalletChain) ? (c as CryptoWalletChain) : null;
}

/**
 * Validate address format for the given chain (best-effort; on-chain APIs are authoritative).
 */
export function isValidCryptoWalletAddress(chain: CryptoWalletChain, address: string): boolean {
  const a = address.trim();
  if (!a || a.length > MAX_CRYPTO_WALLET_ADDRESS_LEN) return false;
  switch (chain) {
    case "ethereum":
      return /^0x[0-9a-fA-F]{40}$/.test(a);
    case "bitcoin": {
      // P2PKH, P2SH, bech32 (incl. taproot)
      if (a.length < 26 || a.length > 90) return false;
      if (/^(bc1|tb1|bc1p)[a-z0-9]{8,}$/i.test(a)) return true;
      return /^[13][a-km-zA-HJ-NP-Z1-9]{24,33}$/.test(a);
    }
    case "solana":
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
    default:
      return false;
  }
}

/**
 * Normalize chain + address from profile fields. Returns null if incomplete or invalid.
 */
export function parseCryptoWalletFromProfile(
  chainRaw: string | null | undefined,
  addressRaw: string | null | undefined
): { chain: CryptoWalletChain; address: string } | null {
  const chain = parseChain(chainRaw);
  const address = addressRaw?.trim() ?? "";
  if (!chain || !address) return null;
  if (!isValidCryptoWalletAddress(chain, address)) return null;
  return { chain, address };
}

function shortAddress(chain: CryptoWalletChain, address: string): string {
  const a = address.trim();
  if (chain === "ethereum" && a.length >= 10) return `${a.slice(0, 6)}…${a.slice(-4)}`;
  if (a.length > 14) return `${a.slice(0, 8)}…${a.slice(-4)}`;
  return a;
}

async function fetchJsonRpc(url: string, body: object): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    next: { revalidate: FETCH_REVALIDATE },
  });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchEthereumBalanceWei(address: string): Promise<bigint | null> {
  const json = (await fetchJsonRpc("https://cloudflare-eth.com", {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBalance",
    params: [address, "latest"],
  })) as { result?: string } | null;
  const hex = json?.result;
  if (!hex || typeof hex !== "string" || !hex.startsWith("0x")) return null;
  try {
    return BigInt(hex);
  } catch {
    return null;
  }
}

async function fetchSolanaBalanceLamports(address: string): Promise<bigint | null> {
  const json = (await fetchJsonRpc("https://api.mainnet-beta.solana.com", {
    jsonrpc: "2.0",
    id: 1,
    method: "getBalance",
    params: [address],
  })) as { result?: { value?: number } } | null;
  const v = json?.result?.value;
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return null;
  return BigInt(Math.floor(v));
}

/** Confirmed balance in satoshis via mempool.space (public). */
async function fetchBitcoinBalanceSatoshis(address: string): Promise<bigint | null> {
  const url = `https://mempool.space/api/address/${encodeURIComponent(address)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: FETCH_REVALIDATE },
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
  const cs = (json as { chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number } }).chain_stats;
  if (!cs || typeof cs.funded_txo_sum !== "number" || typeof cs.spent_txo_sum !== "number") return null;
  const bal = cs.funded_txo_sum - cs.spent_txo_sum;
  if (!Number.isFinite(bal) || bal < 0) return null;
  return BigInt(bal);
}

async function fetchUsdPrices(coingeckoIds: string[]): Promise<Record<string, number>> {
  if (coingeckoIds.length === 0) return {};
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", coingeckoIds.join(","));
  url.searchParams.set("vs_currencies", "usd");
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      next: { revalidate: FETCH_REVALIDATE },
      headers: { Accept: "application/json" },
    });
  } catch {
    return {};
  }
  if (!res.ok) return {};
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {};
  }
  if (!json || typeof json !== "object") return {};
  const out: Record<string, number> = {};
  for (const id of coingeckoIds) {
    const row = (json as Record<string, { usd?: number }>)[id];
    if (row && typeof row.usd === "number" && Number.isFinite(row.usd)) out[id] = row.usd;
  }
  return out;
}

export interface CryptoWidgetData {
  chain: CryptoWalletChain;
  networkLabel: string;
  symbol: string;
  address: string;
  addressShort: string;
  /** Human-readable native amount (ETH, BTC, SOL). */
  balanceNative: number;
  /** Estimated USD value at fetch time, if price available. */
  balanceUsd: number | null;
}

function formatNativeAmount(chain: CryptoWalletChain, amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  const maxFrac = chain === "ethereum" || chain === "solana" ? 6 : 8;
  const rounded = Number(amount.toFixed(maxFrac));
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Fetch native balance + optional USD estimate for a validated chain/address pair.
 */
export async function getCryptoWidgetData(
  chainRaw: string | null | undefined,
  addressRaw: string | null | undefined
): Promise<CryptoWidgetData | null> {
  const parsed = parseCryptoWalletFromProfile(chainRaw, addressRaw);
  if (!parsed) return null;
  const { chain, address } = parsed;
  const meta = CHAIN_META[chain];

  let balanceNative = 0;
  if (chain === "ethereum") {
    const wei = await fetchEthereumBalanceWei(address);
    if (wei === null) return null;
    balanceNative = Number(wei) / 1e18;
  } else if (chain === "solana") {
    const lamports = await fetchSolanaBalanceLamports(address);
    if (lamports === null) return null;
    balanceNative = Number(lamports) / 1e9;
  } else {
    const sat = await fetchBitcoinBalanceSatoshis(address);
    if (sat === null) return null;
    balanceNative = Number(sat) / 1e8;
  }

  balanceNative = formatNativeAmount(chain, balanceNative);

  let balanceUsd: number | null = null;
  const prices = await fetchUsdPrices([meta.coingeckoId]);
  const p = prices[meta.coingeckoId];
  if (p != null && Number.isFinite(p)) {
    const usd = balanceNative * p;
    balanceUsd = Number.isFinite(usd) ? usd : null;
  }

  return {
    chain,
    networkLabel: meta.networkLabel,
    symbol: meta.symbol,
    address,
    addressShort: shortAddress(chain, address),
    balanceNative,
    balanceUsd,
  };
}
