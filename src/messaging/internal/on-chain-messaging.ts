import type { Web3Wallet } from '../../wallet-interfaces';
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
import { createDialect } from '@dialectlabs/web3';
import type { Program } from '@project-serum/anchor';

export class OnChainMessaging implements Messaging {
  constructor(private readonly wallet: Web3Wallet, private program: Program) {}

  async create(command: CreateDialectCommand): Promise<Dialect> {
    const { dialect, publicKey } = await createDialect(
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
    );
    const meMember = dialect.members.find((it) =>
      it.publicKey.equals(this.wallet.publicKey),
    );
    const otherMember = dialect.members.find(
      (it) => !it.publicKey.equals(this.wallet.publicKey),
    );
    if (!meMember || !otherMember) {
      throw new Error('Should not happen');
    }
    return new Web3Dialect(
      this.wallet,
      this.program,
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
    );
  }

  find(query: FindDialectQuery): Promise<Dialect | null> {
    throw new Error('Not implemented');
  }

  findAll(): Promise<Dialect[]> {
    throw new Error('Not implemented');
  }
}

export class Web3Dialect implements Dialect {
  constructor(
    readonly wallet: Web3Wallet,
    readonly program: Program,
    readonly publicKey: PublicKey,
    readonly me: DialectMember,
    readonly otherMember: DialectMember,
    readonly encryptionEnabled: boolean,
  ) {}

  delete(): Promise<void> {
    throw new Error('Not implemented');
  }

  messages(): Promise<Message[]> {
    throw new Error('Not implemented');
  }

  send(command: SendMessageCommand): Promise<void> {
    throw new Error('Not implemented');
  }
}
