import {
  generateRandomNonceWithPrefix,
  NONCE_SIZE_BYTES,
} from './nonce-generator';
import {
  AuthenticationFailedError,
  Curve25519KeyPair,
  ecdhDecrypt,
  ecdhEncrypt,
  Ed25519Key,
  IncorrectPublicKeyFormatError,
} from './ecdh-encryption';
import type { PublicKey } from '../auth/auth.interface';
import { Ed25519PublicKey } from '../auth/ed25519/ed25519-public-key';
import { Err, Ok, Result } from 'ts-results';

export interface TextSerde {
  serialize(text: string): Uint8Array;

  deserialize(bytes: Uint8Array): Result<string, IncorrectPublicKeyFormatError | AuthenticationFailedError>;
}

export class EncryptedTextSerde implements TextSerde {
  private readonly unencryptedTextSerde: UnencryptedTextSerde =
    new UnencryptedTextSerde();

  constructor(
    private readonly encryptionProps: EncryptionProps,
    private readonly members: PublicKey[],
  ) { }

  deserialize(bytes: Uint8Array): Result<string, IncorrectPublicKeyFormatError | AuthenticationFailedError> {
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
    if (encodedText.err) {
      return Err(encodedText.val);
    }
    const decode = this.unencryptedTextSerde.deserialize(encodedText.val);
    if (decode.err) {
      return Err(decode.val);
    }
    return Ok(decode.val);
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
  deserialize(bytes: Uint8Array): Result<string, IncorrectPublicKeyFormatError | AuthenticationFailedError> {
    try {
      const decode = new TextDecoder().decode(bytes);
      return Ok(decode);
    } catch (e) {
      return Err(new IncorrectPublicKeyFormatError);
    }
  }

  serialize(text: string): Uint8Array {
    return new TextEncoder().encode(text);
  }
}

export interface EncryptionProps {
  diffieHellmanKeyPair: Curve25519KeyPair;
  ed25519PublicKey: Ed25519Key;
}
