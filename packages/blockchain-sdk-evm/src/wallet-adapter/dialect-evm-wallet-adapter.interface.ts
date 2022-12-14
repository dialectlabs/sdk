import type { Bytes } from 'ethers/lib/utils';

export interface DialectEvmWalletAdapter {
  address?: string;
  sign: (data: string | Bytes) => Promise<string>;
}
