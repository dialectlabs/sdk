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

    private getAccessControlConditionForWallet(
        publicKey: PublicKey,
      ): AccessControlConditionType {
        return {
            chain: this.chain,
            method: '',
            params: [':userAddress'],
            returnValueTest: {
                key: '',
                comparator: '=',
                value: publicKey.toBase58(),
            },
        };
    }

    getAccessControlConditionForWallets(
        membersWithAccess: PublicKey[],
    ): AccessControlConditionType[] {
        // set and sort to preserve conditions hash
        const membersWithAccessSorted = [...new Set(membersWithAccess)].sort();
        // for each wallet access control condition, add an or operator condition
        const accessControlStackedArray = membersWithAccessSorted.map((item) => [
            AccessControlOrConditionType,
            this.getAccessControlConditionForWallet(item),
        ]);
        // flatten the array
        const conditions = ([] as AccessControlConditionType[])
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
        const accessControlConditions = this.getAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
        const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
          solRpcConditions: accessControlConditions,
          symmetricKey: symmetricKey,
          authSig: authSig,
          chain: this.chain,
        });
        return encryptedSymmetricKey;
      }

    async encrypt(data: string, membersWithAccess: Array<PublicKey>): Promise<EncryptStringResult> {
        // Guard condition
        if (!this.litNodeClient) {
            await this.connect()
        }
        const authSig = await this.checkAndSignAuthMessage();
        const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(data);
        const accessControlConditions = this.getAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
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
        encryptedSymmetricKey: EncryptedSymmetricKey, 
        membersWithAccess: Array<PublicKey>
    ): Promise<string> {
        // Guard condition
        if (!this.litNodeClient) {
            await this.connect()
        }
        const authSig = await this.checkAndSignAuthMessage();
        const accessControlConditions = this.getAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
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

export type AccessControlConditionType =
  | {
      method: string;
      params: string[];
      chain: string;
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
