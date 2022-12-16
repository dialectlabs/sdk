export interface DialectEvmWalletAdapter {
  address?: string;
  sign?: (data: string | ArrayLike<number>) => Promise<string>;
}
