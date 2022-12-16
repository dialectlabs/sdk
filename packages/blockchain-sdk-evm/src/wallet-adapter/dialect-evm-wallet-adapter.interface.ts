import type { Bytes } from 'ethers';

export interface DialectEvmWalletAdapter {
  address?: string;
  sign?: (data: string | Bytes | Uint8Array) => Promise<string>;
}
