import {
  generateRandomNonceWithPrefix,
  NONCE_SIZE_BYTES,
} from './nonce-generator';
import {
  Curve25519KeyPair,
  ecdhDecrypt,
  ecdhEncrypt,
  Ed25519Key,
} from './ecdh-encryption';
import type { PublicKey } from '../auth/auth.interface';
import { Ed25519PublicKey } from '../auth/ed25519/ed25519-public-key';

export interface TextSerde {
  serialize(text: string): Uint8Array;

  deserialize(bytes: Uint8Array): string;
}

export class EncryptedTextSerde implements TextSerde {
  private readonly unencryptedTextSerde: UnencryptedTextSerde =
    new UnencryptedTextSerde();

  constructor(
    private readonly encryptionProps: EncryptionProps,
    private readonly members: PublicKey[],
  ) {}

  deserialize(bytes: Uint8Array): string {
    const encryptionNonce = bytes.slice(0, NONCE_SIZE_BYTES);
    const encryptedText = bytes.slice(NONCE_SIZE_BYTES, bytes.length);
    const otherMember = this.findOtherMember(
      new Ed25519PublicKey(this.encryptionProps.ed25519PublicKey),
    );
    const encodedText = ecdhDecrypt(
      encryptedText,
      this.encryptionProps.diffieHellmanKeyPair,
      otherMember.toBytes(),
      encryptionNonce,
    );
    return this.unencryptedTextSerde.deserialize(encodedText);
  }

  serialize(text: string): Uint8Array {
    const publicKey = new Ed25519PublicKey(
      this.encryptionProps.ed25519PublicKey,
    );
    const senderMemberIdx = this.findMemberIdx(publicKey);
    const textBytes = this.unencryptedTextSerde.serialize(text);
    const otherMember = this.findOtherMember(publicKey);
    const encryptionNonce = generateRandomNonceWithPrefix(senderMemberIdx);
    const encryptedText = ecdhEncrypt(
      textBytes,
      this.encryptionProps.diffieHellmanKeyPair,
      otherMember.toBytes(),
      encryptionNonce,
    );
    return new Uint8Array([...encryptionNonce, ...encryptedText]);
  }

  private findMemberIdx(member: PublicKey) {
    const memberIdx = this.members.findIndex((it) => it.equals(member));
    if (memberIdx === -1) {
      throw new Error('Expected to have other member');
    }
    return memberIdx;
  }

  private findOtherMember(member: PublicKey) {
    const otherMember = this.members.find((it) => !it.equals(member));
    if (!otherMember) {
      throw new Error('Expected to have other member');
    }
    return otherMember;
  }
}

export class UnencryptedTextSerde implements TextSerde {
  deserialize(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  serialize(text: string): Uint8Array {
    return new TextEncoder().encode(text);
  }
}

export type DialectAttributes = {
  encrypted: boolean;
  memberPubKeys: PublicKey[];
};

export interface EncryptionProps {
  diffieHellmanKeyPair: Curve25519KeyPair;
  ed25519PublicKey: Ed25519Key;
}

export class TextSerdeFactory {
  static create(
    { encrypted, memberPubKeys }: DialectAttributes,
    encryptionProps?: EncryptionProps | null,
  ): TextSerde {
    if (!encrypted) {
      return new UnencryptedTextSerde();
    }
    if (encrypted && encryptionProps) {
      return new EncryptedTextSerde(encryptionProps, memberPubKeys);
    }
    throw new Error('Cannot proceed without encryptionProps');
  }
}
