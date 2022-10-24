import { AptosAccount } from 'aptos';
// Common imports
import {
    Dialect,
    DialectCloudEnvironment,
    DialectSdk,
  } from '@dialectlabs/sdk';
  
  // Aptos-specific imports
  import {
    Aptos,
    AptosSdkFactory,
    NodeDialectAptosWalletAdapter
  } from '@dialectlabs/blockchain-sdk-aptos';
  
const environment: DialectCloudEnvironment = 'development';
const aptosAccount = new AptosAccount();

(async () => {
  console.log('private key: ' + aptosAccount.toPrivateKeyObject().privateKeyHex);
  console.log('address: ' + aptosAccount.address());
  const sdk: DialectSdk<Aptos> = Dialect.sdk(
    {
      environment,
    },
    AptosSdkFactory.create({
      wallet: NodeDialectAptosWalletAdapter.create(aptosAccount.signingKey.secretKey),
    }),
  );
  
  const name = 'Example Aptos Dapp';
  const description = 'My Example Aptos Dapp Description';
  
  const dapp = await sdk.dapps.create({
    name,
    description,
  });  
})()