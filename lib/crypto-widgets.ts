/**
 * Crypto wallet widget: native balance on Ethereum, Bitcoin, and/or Solana (public RPC / APIs).
 * Users may set an optional address per network; each gets its own balance card.
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
 * Normalize chain + address from legacy profile fields. Returns null if incomplete or invalid.
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

/** Profile slice for reading wallet addresses (DB row or form). */
export interface CryptoWalletProfileInput {
  cryptoWalletEthereum?: string | null;
  cryptoWalletBitcoin?: string | null;
  cryptoWalletSolana?: string | null;
  /** @deprecated Single network + address; used if per-network fields are empty. */
  cryptoWalletChain?: string | null;
  cryptoWalletAddress?: string | null;
}

/**
 * Resolves which chain addresses to show: per-network fields first, then legacy chain+address.
 */
/**
 * Values for the three dashboard inputs (legacy single chain+address maps into one row).
 */
export function getWalletInputsFromProfileRow(input: CryptoWalletProfileInput): {
  ethereum: string;
  bitcoin: string;
  solana: string;
} {
  const eth = input.cryptoWalletEthereum?.trim() ?? "";
  const btc = input.cryptoWalletBitcoin?.trim() ?? "";
  const sol = input.cryptoWalletSolana?.trim() ?? "";
  if (eth || btc || sol) return { ethereum: eth, bitcoin: btc, solana: sol };
  const legacy = parseCryptoWalletFromProfile(input.cryptoWalletChain, input.cryptoWalletAddress);
  if (!legacy) return { ethereum: "", bitcoin: "", solana: "" };
  if (legacy.chain === "ethereum") return { ethereum: legacy.address, bitcoin: "", solana: "" };
  if (legacy.chain === "bitcoin") return { ethereum: "", bitcoin: legacy.address, solana: "" };
  return { ethereum: "", bitcoin: "", solana: legacy.address };
}

export function collectWalletAddressesFromProfile(input: CryptoWalletProfileInput): Partial<Record<CryptoWalletChain, string>> {
  const out: Partial<Record<CryptoWalletChain, string>> = {};
  const eth = input.cryptoWalletEthereum?.trim();
  const btc = input.cryptoWalletBitcoin?.trim();
  const sol = input.cryptoWalletSolana?.trim();
  if (eth && isValidCryptoWalletAddress("ethereum", eth)) out.ethereum = eth;
  if (btc && isValidCryptoWalletAddress("bitcoin", btc)) out.bitcoin = btc;
  if (sol && isValidCryptoWalletAddress("solana", sol)) out.solana = sol;
  if (Object.keys(out).length === 0) {
    const legacy = parseCryptoWalletFromProfile(input.cryptoWalletChain, input.cryptoWalletAddress);
    if (legacy) out[legacy.chain] = legacy.address;
  }
  return out;
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
  url.searchParams.set("ids", [...new Set(coingeckoIds)].join(","));
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
  balanceNative: number;
  balanceUsd: number | null;
}

function formatNativeAmount(chain: CryptoWalletChain, amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  const maxFrac = chain === "ethereum" || chain === "solana" ? 6 : 8;
  const rounded = Number(amount.toFixed(maxFrac));
  return Object.is(rounded, -0) ? 0 : rounded;
}

async function fetchNativeBalance(chain: CryptoWalletChain, address: string): Promise<number | null> {
  if (chain === "ethereum") {
    const wei = await fetchEthereumBalanceWei(address);
    if (wei === null) return null;
    return formatNativeAmount(chain, Number(wei) / 1e18);
  }
  if (chain === "solana") {
    const lamports = await fetchSolanaBalanceLamports(address);
    if (lamports === null) return null;
    return formatNativeAmount(chain, Number(lamports) / 1e9);
  }
  const sat = await fetchBitcoinBalanceSatoshis(address);
  if (sat === null) return null;
  return formatNativeAmount(chain, Number(sat) / 1e8);
}

const DISPLAY_ORDER: readonly CryptoWalletChain[] = ["ethereum", "bitcoin", "solana"];

/**
 * Fetch native balances + optional USD estimates for all configured valid addresses.
 */
export async function getCryptoWidgetData(input: CryptoWalletProfileInput): Promise<CryptoWidgetData[] | null> {
  const map = collectWalletAddressesFromProfile(input);
  const chains = DISPLAY_ORDER.filter((c) => map[c]);
  if (chains.length === 0) return null;

  const nativeRows = await Promise.all(
    chains.map(async (chain) => {
      const address = map[chain]!;
      const balanceNative = await fetchNativeBalance(chain, address);
      return balanceNative != null ? { chain, address, balanceNative } : null;
    })
  );
  const ok = nativeRows.filter((x): x is { chain: CryptoWalletChain; address: string; balanceNative: number } => x != null);
  if (ok.length === 0) return null;

  const coingeckoIds = ok.map((x) => CHAIN_META[x.chain].coingeckoId);
  const prices = await fetchUsdPrices(coingeckoIds);

  return ok.map((x) => {
    const meta = CHAIN_META[x.chain];
    const p = prices[meta.coingeckoId];
    let balanceUsd: number | null = null;
    if (p != null && Number.isFinite(p)) {
      const usd = x.balanceNative * p;
      balanceUsd = Number.isFinite(usd) ? usd : null;
    }
    return {
      chain: x.chain,
      networkLabel: meta.networkLabel,
      symbol: meta.symbol,
      address: x.address,
      addressShort: shortAddress(x.chain, x.address),
      balanceNative: x.balanceNative,
      balanceUsd,
    };
  });
}
