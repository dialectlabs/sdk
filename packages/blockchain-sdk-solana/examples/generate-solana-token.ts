import {
  DialectSolanaWalletAdapterWrapper,
  DialectWalletAdapterSolanaEd25519TokenSigner,
  NodeDialectSolanaWalletAdapter,
  SolanaEd25519AuthenticationFacadeFactory,
} from '@dialectlabs/blockchain-sdk-solana';

const adapter = NodeDialectSolanaWalletAdapter.create();
const walletAdapter = DialectSolanaWalletAdapterWrapper.create(adapter);

(async () => {
  const signer = new DialectWalletAdapterSolanaEd25519TokenSigner(
    walletAdapter,
  );
  const authenticationFacade = new SolanaEd25519AuthenticationFacadeFactory(
    signer,
  ).get();
  const token = await authenticationFacade.generateToken(120 * 60);
  console.log(token.rawValue);
})();
