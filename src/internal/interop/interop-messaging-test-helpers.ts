import { DialectWalletAdapterEd25519TokenSigner } from "@auth/auth.interface";
import { TokenProvider } from "@auth/internal/token-provider";
import { DataServiceApi } from "@data-service-api/data-service-api";
import { programs } from "@dialectlabs/web3";
import { DialectWalletAdapterEncryptionKeysProvider } from "@encryption/encryption-keys-provider";
import { DataServiceMessaging } from "@messaging/internal/data-service-messaging";
import { createDialectProgram } from "@messaging/internal/solana-dialect-program-factory";
import { SolanaMessaging } from "@messaging/internal/solana-messaging";
import type { Messaging } from "@messaging/messaging.interface";
import { Backend } from "@sdk/sdk.interface";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { DialectWalletAdapterWrapper } from "@wallet-adapter/dialect-wallet-adapter-wrapper";
import { NodeDialectWalletAdapter } from "@wallet-adapter/node-dialect-wallet-adapter";
import { Duration } from "luxon";
import { primaryKeyPair, secondaryKeyPair } from "./interop-keypairs";

export class InteroperabilityMessagingConfig {
    static timeoutDuration: Duration = Duration.fromObject({minutes: 25});
    
    readonly primaryKeyPair = primaryKeyPair;
    readonly secondaryKeyPair = secondaryKeyPair;

    static baseUrl = "http://localhost:8080";

    static message1 = "Hey, bumping you on my offer";
    static message2 = "Oh thanks, totally forgot. Btw this chat is slick 😃";
    static message3 = "Ikr, not sure how I would've reached you otherwise";

    constructor(
        readonly encrypted: boolean,
        readonly backend: Backend,
    ) {}

    static asEncryptedDialectCloud(): InteroperabilityMessagingConfig {
        return new InteroperabilityMessagingConfig(true, Backend.DialectCloud);
    }

    static asUnencryptedDialectCloud(): InteroperabilityMessagingConfig {
        return new InteroperabilityMessagingConfig(false, Backend.DialectCloud);
    }

    static asEncryptedSolana(): InteroperabilityMessagingConfig {
        return new InteroperabilityMessagingConfig(true, Backend.Solana);
    }

    static asUnencryptedSolana(): InteroperabilityMessagingConfig {
        return new InteroperabilityMessagingConfig(false, Backend.Solana);
    }

    static get testingNow() {
        return InteroperabilityMessagingConfig.asUnencryptedSolana();
    }

    public get messagingMap() {
        switch(this.backend) {
            case Backend.Solana:
                return (() => createSolanaServiceMessaging(this.primaryKeyPair, this.secondaryKeyPair));
            case Backend.DialectCloud:
                return (() => createDataServiceMessaging(this.primaryKeyPair, this.secondaryKeyPair));
        }
    }
}

async function createSolanaServiceMessaging(primary: Keypair, secondary: Keypair) {
    const [wallet1, wallet2] = await Promise.all([
      createSolanaWalletMessagingState(primary),
      createSolanaWalletMessagingState(secondary),
    ]);
  
    const solanaMessagingState: MessagingState = {
      wallet1,
      wallet2,
    };
    return solanaMessagingState;
  }
  
  async function createSolanaWalletMessagingState(keypair: Keypair): Promise<WalletMessagingState> {
    const walletAdapter = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(keypair),
    );
    const program = createDialectProgram(
        walletAdapter,
        new PublicKey(programs['localnet'].programAddress),
        programs['localnet'].clusterAddress
    );
    const airdropRequest = await program.provider.connection.requestAirdrop(
      walletAdapter.publicKey,
      LAMPORTS_PER_SOL * 100,
    );
    await program.provider.connection.confirmTransaction(airdropRequest);
    const userSolanaMessaging = SolanaMessaging.create(walletAdapter, program);
    return {
      adapter: walletAdapter,
      messaging: userSolanaMessaging,
    };
  }
  
  async function createDataServiceMessaging(primary: Keypair, secondary: Keypair) {
    const user1Wallet = NodeDialectWalletAdapter.create(primary);
    const user1WalletAdapter = new DialectWalletAdapterWrapper(user1Wallet);
    const user2Wallet = NodeDialectWalletAdapter.create(secondary);
    const user2WalletAdapter = new DialectWalletAdapterWrapper(user2Wallet);
    const user1DataServiceMessaging = new DataServiceMessaging(
      user1WalletAdapter.publicKey,
      DataServiceApi.create(
        InteroperabilityMessagingConfig.baseUrl,
        TokenProvider.create(
          new DialectWalletAdapterEd25519TokenSigner(user1WalletAdapter),
        ),
      ).threads,
      new DialectWalletAdapterEncryptionKeysProvider(user1WalletAdapter),
    );
    const user2DataServiceMessaging = new DataServiceMessaging(
      user2WalletAdapter.publicKey,
      DataServiceApi.create(
        InteroperabilityMessagingConfig.baseUrl,
        TokenProvider.create(
          new DialectWalletAdapterEd25519TokenSigner(user2WalletAdapter),
        ),
      ).threads,
      new DialectWalletAdapterEncryptionKeysProvider(user2WalletAdapter),
    );
    const dataServiceMessagingState: MessagingState = {
      wallet1: {
        adapter: user1WalletAdapter,
        messaging: user1DataServiceMessaging,
      },
      wallet2: {
        adapter: user2WalletAdapter,
        messaging: user2DataServiceMessaging,
      },
    };
    return dataServiceMessagingState;
  }

  export interface WalletMessagingState {
    adapter: DialectWalletAdapterWrapper;
    messaging: Messaging;
  }
  
  export interface MessagingState {
    wallet1: WalletMessagingState;
    wallet2: WalletMessagingState;
  }

