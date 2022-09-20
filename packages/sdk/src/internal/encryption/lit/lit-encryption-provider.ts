import LitJsSdk from "@lit-protocol/sdk-nodejs";
import type { PublicKey } from '@solana/web3.js'; // TODO: This needs to become agnostic
import type { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import { LitSignatureStore } from './lit-sig-store';

type EncryptStringResult = {
    encryptedString: string,
    encryptedSymmetricKey: EncryptedSymmetricKey,
}
type EncryptedSymmetricKey = Uint8Array;

const AUTH_SIGNATURE_BODY =
  'I am creating an account to use Lit Protocol at {{timestamp}}';

export class LitEncryptionProvider {
    private litNodeClient: any;
    private chain: ChainType;
    private signatureStore: LitSignatureStore;
    private readonly dialectWalletAdapter: DialectWalletAdapterWrapper;
    private debug: boolean;

    constructor(
        chain: ChainType, 
        dialectWalletAdapter: DialectWalletAdapterWrapper,
        signatureStore?: LitSignatureStore,
        debug: boolean = false
    ) {
        this.dialectWalletAdapter = dialectWalletAdapter;
        this.chain = chain;
        this.debug = debug;
        if(signatureStore) {
            this.signatureStore = signatureStore;
        }else{
            this.signatureStore = LitSignatureStore.createLocalStorage();
        }
    }

    async connect() {
        let client = new LitJsSdk.LitNodeClient({
            alertWhenUnauthorized: false,
            debug: this.debug,
        });
        await client.connect()
        this.litNodeClient = client;
    }

    private getEtheriumAccessControlConditionForWallet(
        walletAddress: string,
    ): EthereumAccessControlConditionType {
        // TODO: Unimplemented
        return {};
    }

    private getSolanaAccessControlConditionForWallet(
        publicKey: PublicKey,
      ): SolanaAccessControlConditionType {
        return {
            chain: ChainType.Solana,
            method: '',
            //Experimental
            pdaParams: [],
            pdaInterface: { offset: 0, fields: {} },
            pdaKey: "",
            // Experimental
            params: [':userAddress'],
            returnValueTest: {
                key: '',
                comparator: '=',
                value: publicKey.toBase58(),
            },
        };
    }

    getSolanaAccessControlConditionForWallets(
        membersWithAccess: PublicKey[],
    ): SolanaAccessControlConditionType[] {
        // set and sort to preserve conditions hash
        const membersWithAccessSorted = [...new Set(membersWithAccess)].sort();

        // for each wallet access control condition, add an or operator condition
        const accessControlStackedArray = membersWithAccessSorted.map((item) => [
            AccessControlOrConditionType,
            this.getSolanaAccessControlConditionForWallet(item),
        ]);

        // flatten the array
        const conditions = ([] as SolanaAccessControlConditionType[])
            .concat(...accessControlStackedArray);

        // remove the first or operator condition
        conditions.splice(0,1);
        return conditions;
    }

    private async generateSymmetricKey(): Promise<Uint8Array> {
        const symmKey = await LitJsSdk.generateSymmetricKey();
        return new Uint8Array(
          await crypto.subtle.exportKey("raw", symmKey)
        );
    }

    async createEncryptedSymmetricKey(membersWithAccess: Array<PublicKey>): Promise<EncryptedSymmetricKey> {
        if (!this.litNodeClient) {
          await this.connect();
        }
        const authSig = await this.checkAndSignAuthMessage();
        const symmetricKey = await this.generateSymmetricKey();
        // TODO: If chain type is not solana then we need to specify different conditions here
        const accessControlConditions = this.getSolanaAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
        // Save the key with conditions that members must meet to decrypt
        const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
          solRpcConditions: accessControlConditions,
          symmetricKey: symmetricKey,
          authSig: authSig,
          chain: this.chain,
        });
        return encryptedSymmetricKey;
      }

    async encrypt(data: string, membersWithAccess: Array<PublicKey>, encryptionKey?: EncryptedSymmetricKey): Promise<EncryptStringResult> {
        // Guard condition
        if (!this.litNodeClient) {
            await this.connect()
        }
        if(encryptionKey) {
            return await this.encryptWithKey(encryptionKey, data, membersWithAccess);
        }else {
            return await this.encryptWithoutKey(data, membersWithAccess);
        }
        /*
        const authSig = await this.checkAndSignAuthMessage();
        const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(data);
        // TODO: If chain type is not solana then we need to specify different conditions here
        const accessControlConditions = this.getSolanaAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
        // Save the key with conditions that members must meet to decrypt
        const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
            solRpcConditions: accessControlConditions,
            symmetricKey: symmetricKey,
            authSig: authSig,
            chain: this.chain,
        });
        let result: EncryptStringResult = {
            encryptedString: encryptedString,
            encryptedSymmetricKey: encryptedSymmetricKey,
        };
        return result;
        */
    }

    private async encryptWithKey(encryptionKey: EncryptedSymmetricKey, data: string, membersWithAccess: Array<PublicKey>): Promise<EncryptStringResult> {
        const authSig = await this.checkAndSignAuthMessage();
        // TODO: If chain type is not solana then we need to specify different conditions here
        const accessControlConditions = this.getSolanaAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
        const symmetricKey = await this.litNodeClient.getEncryptionKey({
            solRpcConditions: accessControlConditions,
            toDecrypt: LitJsSdk.uint8arrayToString(
                encryptionKey,
                "base16"
              ),
            authSig: authSig,
            chain: this.chain,
        });
        const importedSymmetricKey = await LitJsSdk.importSymmetricKey(symmetricKey);
        const encodedString = LitJsSdk.uint8arrayFromString(data, "utf8");
        const encryptedString = await LitJsSdk.encryptWithSymmetricKey(
        importedSymmetricKey,
        encodedString.buffer
        )
        let result: EncryptStringResult = {
            encryptedString: encryptedString,
            encryptedSymmetricKey: encryptionKey,
        };
        return result;
    }

    private async encryptWithoutKey(data: string, membersWithAccess: Array<PublicKey>): Promise<EncryptStringResult> {
        const authSig = await this.checkAndSignAuthMessage();
        const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(data);
        // TODO: If chain type is not solana then we need to specify different conditions here
        const accessControlConditions = this.getSolanaAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
        // Save the key with conditions that members must meet to decrypt
        const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
             solRpcConditions: accessControlConditions,
             symmetricKey: symmetricKey,
             authSig: authSig,
             chain: this.chain,
         });
         let result: EncryptStringResult = {
             encryptedString: encryptedString,
             encryptedSymmetricKey: encryptedSymmetricKey,
         };
         return result;
    }

    async decrypt(
        encryptedString: string, 
        membersWithAccess: Array<PublicKey>,
        encryptedSymmetricKey: EncryptedSymmetricKey, 
    ): Promise<string> {
        // Guard condition
        if (!this.litNodeClient) {
            await this.connect()
        }
        const authSig = await this.checkAndSignAuthMessage();
        // TODO: If chain type is not solana then we need to specify different conditions here
        const accessControlConditions = this.getSolanaAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
        const symmetricKey = await this.litNodeClient.getEncryptionKey({
            solRpcConditions: accessControlConditions,
            toDecrypt: LitJsSdk.uint8arrayToString(
                encryptedSymmetricKey,
                "base16"
              ),
            authSig: authSig,
            chain: this.chain,
          })
        const decryptedString = await LitJsSdk.decryptString(
            encryptedString,
            symmetricKey
        );
        return decryptedString;
    }

    private async checkAndSignAuthMessage(): Promise<AuthSig> {
        let authSigString = this.signatureStore.get(
          this.dialectWalletAdapter.publicKey,
        );
        if (!authSigString) {
          await this.signAndSaveAuthMessage();
          authSigString = this.signatureStore.get(
            this.dialectWalletAdapter.publicKey,
          );
        }
        let authSig: AuthSig = JSON.parse(authSigString!);
    
        if (this.dialectWalletAdapter.publicKey.toBase58() !== authSig.address) {
          await this.signAndSaveAuthMessage();
          authSigString = this.signatureStore.get(
            this.dialectWalletAdapter.publicKey,
          );
          authSig = JSON.parse(authSigString!);
        }
        return authSig;
      }
    
      private async signAndSaveAuthMessage() {
        const now = new Date().toISOString();
        const body = AUTH_SIGNATURE_BODY.replace('{{timestamp}}', now);
    
        const data = new TextEncoder().encode(body);
        const signed = await this.dialectWalletAdapter.signMessage(data);
    
        const hexSig = LitJsSdk.uint8arrayToString(signed, 'base16');
    
        const authSig = {
          sig: hexSig,
          derivedVia: 'solana.signMessage',
          signedMessage: body,
          address: this.dialectWalletAdapter.publicKey.toBase58(),
        };
    
        this.signatureStore.save(
          this.dialectWalletAdapter.publicKey,
          JSON.stringify(authSig),
        );
        return authSig;
      }
}

export type AuthSig = {
    sig: string;
    derivedVia: string;
    signedMessage: string;
    address: string;
};

export enum ChainType {
    Ethereum = 'ethereum',
    Solana = 'solana',
}

export type EthereumAccessControlConditionType = {};

export type SolanaAccessControlConditionType =
  | {
      method: string;
      params: string[];
      chain: string;
      // Experimental
      pdaParams: [],
      pdaInterface: { offset: 0, fields: {} },
      pdaKey: "",
      // Experimental
      returnValueTest: {
        key: string;
        comparator: string;
        value: string;
      };
    }
  | typeof AccessControlOrConditionType;

export const AccessControlOrConditionType = { operator: 'or' };

export enum ContractType {
    ERC20 = 'erc20',
    ERC721 = 'erc721',
    ERC1155 = 'erc1155',
}
