import type { PublicKey } from "@solana/web3.js";
import type { DialectWalletAdapterWrapper } from "@wallet-adapter/dialect-wallet-adapter-wrapper";
import LitJsSdk from 'lit-js-sdk';

const client = new LitJsSdk.LitNodeClient()
const chain = 'solana'
const AUTH_SIGNATURE_BODY =
  "I am creating an account to use Lit Protocol at {{timestamp}}";

export class LitProtocolEncryptionProvider {
  constructor(
    private readonly dialectWalletAdapter: DialectWalletAdapterWrapper,
  ) {
      LitJsSdk.encryptString();
  }
  private litNodeClient: any;

  async connect() {
    await client.connect()
    this.litNodeClient = client
  }

  async encrypt(message: string, otherMembers: PublicKey[]) {
    if (!this.litNodeClient) {
      await this.connect()
    }

    const authSig = await this.checkAndSignAuthMessage()
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(message);

    const accessControlConditions = getAccessControlConditionForWallets([this.dialectWalletAdapter.publicKey, ...otherMembers]);
    const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain,
    })

    return {
      encryptedString,
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    }
  }

  async checkAndSignAuthMessage(): Promise<AuthSig> {
    let authSigString = localStorage.getItem("lit-auth-sol-signature");
    if (!authSigString) {
      await this.signAndSaveAuthMessage();
      authSigString = localStorage.getItem("lit-auth-sol-signature");
    }
    let authSig: AuthSig = JSON.parse(authSigString!);

    if (this.dialectWalletAdapter.publicKey.toBase58() !== authSig.address) {
      await this.signAndSaveAuthMessage();
      authSigString = localStorage.getItem("lit-auth-sol-signature");
      authSig = JSON.parse(authSigString!);
    }
    return authSig;
  }

  async signAndSaveAuthMessage() {
    const now = new Date().toISOString();
    const body = AUTH_SIGNATURE_BODY.replace("{{timestamp}}", now);
  
    const data = new TextEncoder().encode(body);
    const signed = await this.dialectWalletAdapter.signMessage(data);
  
    const hexSig = LitJsSdk.uint8arrayToString(signed, "base16");
  
    const authSig = {
      sig: hexSig,
      derivedVia: "solana.signMessage",
      signedMessage: body,
      address: this.dialectWalletAdapter.publicKey.toBase58(),
    };
  
    localStorage.setItem("lit-auth-sol-signature", JSON.stringify(authSig));
    return authSig;
  }

  // async encryptString(key: string, str: string) {
  //   // -- validate
  //   if (
  //     !LitJsSdk.checkType({
  //       value: str,
  //       allowedTypes: ["String"],
  //       paramName: "str",
  //       functionName: "encryptString",
  //     })
  //   )
  //     return;
  //   const encodedString = LitJsSdk.uint8arrayFromString(str, "utf8");
  
  //   const symmKey = await LitJsSdk.generateSymmetricKey();
  //   const encryptedString = await LitJsSdk.encryptWithSymmetricKey(
  //     symmKey,
  //     encodedString.buffer
  //   );
  
  //   const exportedSymmKey = new Uint8Array(
  //     await crypto.subtle.exportKey("raw", symmKey)
  //   );
  
  //   return {
  //     symmetricKey: exportedSymmKey,
  //     encryptedString,
  //     encryptedData: encryptedString,
  //   };
  // }
}

export type AuthSig = {
  sig: string,
  derivedVia: string,
  signedMessage: string,
  address: string
}

export type AccessControlConditionType = {
  method: string,
  params: string[],
  chain: string,
  returnValueTest: {
    key: string,
    comparator: string,
    value: string
  }
} | typeof AccessControlOrConditionType;
export const AccessControlOrConditionType = {"operator": "or"};

export function getAccessControlConditionForWallet(publicKey: PublicKey): AccessControlConditionType {
  return {
    method: "",
    params: [":userAddress"],
    chain: 'solana',
    returnValueTest: {
      key: "",
      comparator: "=",
      value: publicKey.toBase58(),
    },
  };
}

export function getAccessControlConditionForWallets(otherMembers: PublicKey[]): AccessControlConditionType[] {
  // for each wallet access control condition, add an or operator condition
  const accessControlStackedArray = otherMembers.map((item) => [
    {"operator": "or"}, getAccessControlConditionForWallet(item)
  ]);
  // flatten the array and remove the first or operator condition
  return ([] as AccessControlConditionType[])
    .concat(...accessControlStackedArray)
    .splice(0, 1);
}