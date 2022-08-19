import type { PublicKey as SolanaKey } from '@solana/web3.js';
import type { AptosAccount } from "aptos";

export abstract class WalletAddress {
    equals(recipient: WalletAddress): boolean {
        return this.toString() === recipient.toString();
    }
    abstract encode(): Buffer;
    abstract toBuffer(): Buffer;
    abstract toString(): string;
    abstract toBytes(): Uint8Array;
    abstract toBase58(): string;
    abstract toJSON(): string;
}

export class SolanaAddress extends WalletAddress {
    encode(): Buffer {
        return this.publicKey.encode();
    }
    toBuffer(): Buffer {
        return this.publicKey.toBuffer();
    }
    toJSON(): string {
        return this.publicKey.toJSON();
    }
    public constructor(private readonly publicKey: SolanaKey) {
        super();
        this.publicKey = publicKey;
    }

    toBase58(): string {
        return this.publicKey.toBase58();
    }

    toBytes(): Uint8Array {
        return this.publicKey.toBytes();
    }

    toString(): string {
        return this.publicKey.toBase58();
    }
}

export class AptosAddress extends WalletAddress {
    encode(): Buffer {
        return this.toBuffer();
    }
    toBuffer(): Buffer {
        return Buffer.from(this.publicKey.address().toUint8Array());
    }
    toJSON(): string {
        throw new Error('Method not implemented.');
    }
    constructor(private readonly publicKey: AptosAccount) {
        super();
        this.publicKey = publicKey;
    }
    toBase58(): string {
        // TODO: Double check this
        return this.publicKey.address.toString();
    }
    toBytes(): Uint8Array {
        return this.publicKey.address().toUint8Array();
    }
    toString(): string {
        return this.publicKey.address().toString();
    }
}
