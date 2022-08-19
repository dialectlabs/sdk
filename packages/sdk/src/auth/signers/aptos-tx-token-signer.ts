import type { TokenSigner, TokenSignerResult } from "@auth/auth.interface";
import type { DialectWalletAdapterWrapper } from "@dialectlabs/sdk/lib/types/wallet-adapter/dialect-wallet-adapter-wrapper";
import type { WalletAddress } from "@wallet/internal/wallet-address";

export abstract class AptosTxTokenSigner implements TokenSigner {
    readonly alg = 'aptos-tx';
    abstract subject: WalletAddress;
    abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterAptosTxTokenSigner extends AptosTxTokenSigner {
    sign(payload: Uint8Array): Promise<TokenSignerResult> {
        throw new Error("Method not implemented.");
    }
    readonly subject: WalletAddress;
    constructor(readonly dialectWalletAdapter: DialectWalletAdapterWrapper) {
        super();
        this.subject = dialectWalletAdapter.publicKey;
    }
}