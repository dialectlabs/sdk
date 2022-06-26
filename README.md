# SDK

## Run the examples

## Usage

```typescript
import { PublicKey } from '@solana/web3';j
import { Dialect, SolanaConfig } from '@dialectlabs/sdk';
import { useWallet } from '@solana/wallet-adapter-react';

const environment = 'production' // 'development', 'local-development'
const wallet: DialectWalletAdapter = useWallet(); // Or a node wallet
const solana: SolanaConfig = {
  dialectProgramAddress: new PublicKey()
}

const sdk = Dialect.sdk({
  environment, 
  wallet,
  solana,
});
```
