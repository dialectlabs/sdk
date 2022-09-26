import { AptosAccount, AptosClient, FaucetClient } from 'aptos';

const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');
const faucetClient = new FaucetClient(
  'https://fullnode.devnet.aptoslabs.com/v1',
  'https://faucet.devnet.aptoslabs.com',
);

async function main() {
  const originalAccount = new AptosAccount();
  await faucetClient.fundAccount(originalAccount.address(), 20_000);

  const newAccount = new AptosAccount();

  await client.rotateAuthKeyEd25519(
    originalAccount,
    newAccount.signingKey.secretKey,
  );
  const lookedUpOriginalAddress = await client.lookupOriginalAddress(
    newAccount.address(),
  );
  console.log('originalAddress', originalAccount.address());
  console.log('newAddress', newAccount.address());
  console.log('lookedUpOriginalAddress', lookedUpOriginalAddress);
}

main();
