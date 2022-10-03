# Dialect SDK monorepo

## Packages

- [SDK](https://github.com/dialectlabs/sdk/tree/main/packages/sdk) - The Dialect SDK is a single typescript library for interacting with Dialect's off chain resources
- [Solana SDK](https://github.com/dialectlabs/sdk/tree/main/packages/blockchain-sdk-solana) - bridge for solana blockchain to interact with dialect's on chain resources and solana wallets
- [Aptos SDK](https://github.com/dialectlabs/sdk/tree/main/packages/blockchain-sdk-aptos) - bridge for aptos blockchain to interact with aptos wallets
- [Identity Dialect Dapps](https://github.com/dialectlabs/sdk/tree/main/packages/identity-dialect-dapps) - Dialect identity provider to resolve dapps by it's public keys
- [Identity SNS](https://github.com/dialectlabs/sdk/tree/main/packages/identity-sns) - bridge for SNS identity to resolve sns domains and owner details
- [Identity Cardinal](https://github.com/dialectlabs/sdk/tree/main/packages/identity-cardinal) - bridge for cardinal twitter identity to resolve solana public keys by twitter handles and vice verca

## Setting up development environment

```
yarn && yarn build:all
```
