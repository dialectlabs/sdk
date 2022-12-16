import type { Bytes } from 'ethers';

export interface DialectEvmWalletAdapter {
  address?: string;
  sign?: (data: string | Uint8Array) => Promise<string>;
}
