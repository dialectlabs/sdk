import { DialectWalletAdapterWrapper } from "@wallet-adapter/dialect-wallet-adapter-wrapper";
import { NodeDialectWalletAdapter } from "@wallet-adapter/node-dialect-wallet-adapter";
import { LitProtocolEncryptionProvider } from "./lit-encryption-provider";

describe('lit encryption tests', () => {
    let wallet: DialectWalletAdapterWrapper;
    let provider: LitProtocolEncryptionProvider;

    beforeEach(() => {
      wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
      provider = new LitProtocolEncryptionProvider(wallet);
    });
  
    test('encrypt/decrypt', async () => {
        const result = provider.encrypt("Hey Kevin", []);
        console.log(result);
    });
  });
  