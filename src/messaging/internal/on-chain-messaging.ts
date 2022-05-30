import type {
  Web3EncryptedMessagingWallet,
  Web3Wallet,
} from '../../wallet-interfaces';
import type {
  CreateDialectCommand,
  Dialect,
  DialectMember,
  FindDialectQuery,
  Message,
  Messaging,
  SendMessageCommand,
} from './messaging.interface';
import { DialectMemberScope } from './messaging.interface';
import type { PublicKey } from '@solana/web3.js';
import {
  createDialect,
  deleteDialect,
  DialectAccount,
  findDialects,
  getDialect,
  sendMessage,
} from '@dialectlabs/web3';
import type { Program } from '@project-serum/anchor';

export class OnChainMessaging implements Messaging {
  constructor(
    private readonly wallet: Web3Wallet | Web3EncryptedMessagingWallet,
    private program: Program,
  ) {}

  async create(command: CreateDialectCommand): Promise<Dialect> {
    const encrypted = command.encrypted;
    const encryptionProps = await getEncryptionProps(
      command.encrypted,
      this.wallet,
    );
    // TODO: same as for web2! accurate handling of dh absence: extract adapter interface + handle sollet
    const dialectAccount = await createDialect(
      this.program,
      this.wallet,
      [
        {
          publicKey: this.wallet.publicKey,
          scopes: [
            command.me.scopes.some((it) => it === DialectMemberScope.ADMIN),
            command.me.scopes.some((it) => it === DialectMemberScope.WRITE),
          ],
        },
        {
          publicKey: command.otherMember.publicKey,
          scopes: [
            command.otherMember.scopes.some(
              (it) => it === DialectMemberScope.ADMIN,
            ),
            command.otherMember.scopes.some(
              (it) => it === DialectMemberScope.WRITE,
            ),
          ],
        },
      ],
      encrypted,
      encryptionProps,
    );
    return toWeb3Dialect(dialectAccount, this.wallet, this.program);
  }

  async find(query: FindDialectQuery): Promise<Dialect | null> {
    const encryptionProps = await getEncryptionProps(true, this.wallet);
    try {
      const dialectAccount = await getDialect(
        this.program,
        query.publicKey,
        encryptionProps,
      );
      return toWeb3Dialect(dialectAccount, this.wallet, this.program);
    } catch (e) {
      const err = e as Error;
      if (err?.message.includes('Account does not exist')) return null;
      throw e;
    }
  }

  async findAll(): Promise<Dialect[]> {
    // TODO: rn we have different behavior for web3 and web2 versions: this one always returns empty msgs
    // TODO: why we don't pass encryptionProps here in protocol?
    const dialects = await findDialects(this.program, {
      userPk: this.wallet.publicKey,
    });
    return dialects.map((it) => toWeb3Dialect(it, this.wallet, this.program));
  }
}

export class Web3Dialect implements Dialect {
  constructor(
    readonly wallet: Web3Wallet | Web3EncryptedMessagingWallet,
    readonly program: Program,
    readonly publicKey: PublicKey,
    readonly me: DialectMember,
    readonly otherMember: DialectMember,
    readonly encrypted: boolean,
    private dialectAccount: DialectAccount,
  ) {}

  async delete(): Promise<void> {
    await deleteDialect(this.program, this.dialectAccount, this.wallet);
  }

  async messages(): Promise<Message[]> {
    const encryptionProps = await getEncryptionProps(true, this.wallet);
    this.dialectAccount = await getDialect(
      this.program,
      this.dialectAccount.publicKey,
      encryptionProps,
    );
    return this.dialectAccount.dialect.messages.map((it) => ({
      author: it.owner.equals(this.me.publicKey) ? this.me : this.otherMember,
      timestamp: new Date(it.timestamp),
      text: it.text,
    }));
  }

  async send(command: SendMessageCommand): Promise<void> {
    const encryptionProps = await getEncryptionProps(
      this.encrypted,
      this.wallet,
    );
    await sendMessage(
      this.program,
      this.dialectAccount,
      this.wallet,
      command.text,
      encryptionProps,
    );
  }
}

function toWeb3Dialect(
  dialectAccount: DialectAccount,
  wallet: Web3Wallet | Web3EncryptedMessagingWallet,
  program: Program,
) {
  const { dialect, publicKey } = dialectAccount;
  const meMember = dialect.members.find((it) =>
    it.publicKey.equals(wallet.publicKey),
  );
  const otherMember = dialect.members.find(
    (it) => !it.publicKey.equals(wallet.publicKey),
  );
  if (!meMember || !otherMember) {
    throw new Error('Should not happen');
  }
  return new Web3Dialect(
    wallet,
    program,
    publicKey,
    {
      publicKey: meMember.publicKey,
      scopes: [
        ...(meMember.scopes[0] ? [DialectMemberScope.ADMIN] : []),
        ...(meMember.scopes[1] ? [DialectMemberScope.WRITE] : []),
      ],
    },
    {
      publicKey: otherMember.publicKey,
      scopes: [
        ...(otherMember.scopes[0] ? [DialectMemberScope.ADMIN] : []),
        ...(otherMember.scopes[1] ? [DialectMemberScope.WRITE] : []),
      ],
    },
    dialect.encrypted,
    dialectAccount,
  );
}

async function getEncryptionProps(
  encrypted: boolean,
  wallet: Web3Wallet | Web3EncryptedMessagingWallet,
) {
  return (
    (encrypted &&
      'diffieHellman' in wallet &&
      !!wallet.diffieHellman && {
        diffieHellmanKeyPair: await wallet.diffieHellman(
          wallet.publicKey.toBytes(),
        ),
        ed25519PublicKey: wallet.publicKey.toBytes(),
      }) ||
    undefined
  );
}
