import type { PublicKey } from '@solana/web3.js';
import type { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import LitJsSdk from 'lit-js-sdk';
import type { LitSignatureStore } from './lit-sig-store';

const client = new LitJsSdk.LitNodeClient({ litNetwork: 'serrano' });
const chain = 'solana';
const AUTH_SIGNATURE_BODY =
  'I am creating an account to use Lit Protocol at {{timestamp}}';

type EncryptStringResult = {
  encryptedString: string,
  encryptedSymmetricKey: string
}

export class LitProtocolEncryptionProvider {
  constructor(
    private readonly dialectWalletAdapter: DialectWalletAdapterWrapper,
    private signatureStore: LitSignatureStore,
  ) {}

  private litNodeClient: any;

  async connect() {
    await client.connect();
    this.litNodeClient = client;
  }

  private async generateSymmetricKey(): Promise<Uint8Array> {
    const symmKey = await LitJsSdk.generateSymmetricKey();
    return new Uint8Array(
      await crypto.subtle.exportKey("raw", symmKey)
    );
  }

  async createEncryptedSymmetricKey(membersWithAccess: PublicKey[]): Promise<string> {
    if (!this.litNodeClient) {
      await this.connect();
    }
    const authSig = await this.checkAndSignAuthMessage();
    const symmetricKey = await this.generateSymmetricKey();
    const accessControlConditions = getAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      solRpcConditions: accessControlConditions,
      symmetricKey: symmetricKey,
      authSig: authSig,
      chain: chain,
    });
    return LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16");
  }

  async encrypt(message: string, membersWithAccess: PublicKey[], key?: string): Promise<EncryptStringResult> {
    if (!this.litNodeClient) {
      await this.connect();
    }

    if (key) {
      return this.encryptWithKey(key, message, membersWithAccess);
    }
    return this.encryptWithoutKey(message, membersWithAccess);
  }

  private async encryptWithoutKey(message: string, membersWithAccess: PublicKey[]): Promise<EncryptStringResult> {
    const authSig = await this.checkAndSignAuthMessage();
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
      message,
    );

    const accessControlConditions = getAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      solRpcConditions: accessControlConditions,
      symmetricKey: symmetricKey,
      authSig: authSig,
      chain: chain,
    });

    return {
      encryptedString,
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    }
  }

  private async encryptWithKey(encryptedSymmetricKey: string, message: string, membersWithAccess: PublicKey[]): Promise<EncryptStringResult> {
    const authSig = await this.checkAndSignAuthMessage();
    const accessControlConditions = getAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
    const symmetricKey = await this.litNodeClient.getEncryptionKey({
      solRpcConditions: accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain: chain,
      authSig: authSig
    });

    const importedSymmetricKey = await LitJsSdk.importSymmetricKey(symmetricKey);
    const encodedString = LitJsSdk.uint8arrayFromString(message, "utf8");
    const encryptedString = await LitJsSdk.encryptWithSymmetricKey(
      importedSymmetricKey,
      encodedString.buffer
    )
    return {
      encryptedString,
      encryptedSymmetricKey: encryptedSymmetricKey
    }
  }

  async decrypt(encryptedString: string, encryptedSymmetricKey: string, membersWithAccess: PublicKey[]) {
    if (!this.litNodeClient) {
      await this.connect();
    }

    const authSig = await this.checkAndSignAuthMessage();

    const accessControlConditions = getAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...membersWithAccess]);
    const symmetricKey = await this.litNodeClient.getEncryptionKey({
      solRpcConditions: accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain: chain,
      authSig: authSig
    });
    console.log(symmetricKey);
    console.log(encryptedString);
    const decryptedString = await LitJsSdk.decryptString(
      encryptedString,
      symmetricKey
    );
    console.log(decryptedString);
    // return decryptedString;
    return "";
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

export function getAccessControlConditionForWallet(
  publicKey: PublicKey,
): AccessControlConditionType {
  return {
    method: '',
    params: [':userAddress'],
    chain: 'solana',
    returnValueTest: {
      key: '',
      comparator: '=',
      value: publicKey.toBase58(),
    },
  };
}

export function getAccessControlConditionForWallets(
  membersWithAccess: PublicKey[],
): AccessControlConditionType[] {
  // set and sort to preserve conditions hash
  const membersWithAccessSorted = [...new Set(membersWithAccess)].sort();
  // for each wallet access control condition, add an or operator condition
  const accessControlStackedArray = membersWithAccessSorted.map((item) => [
    { operator: 'or' },
    getAccessControlConditionForWallet(item),
  ]);
  // flatten the array
  const conditions = ([] as AccessControlConditionType[])
    .concat(...accessControlStackedArray);
  // remove the first or operator condition
  conditions.splice(0,1);
  return conditions;
}
