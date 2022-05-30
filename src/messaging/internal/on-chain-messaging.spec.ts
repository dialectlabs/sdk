import type { CreateDialectCommand, Messaging } from './messaging.interface';
import { DialectMemberScope } from './messaging.interface';
import { EmbeddedDialectWalletAdapter } from '../../node-dialect-wallet-adapter';
import { createDialectProgram } from './dialect-connection';
import { OnChainMessaging } from './on-chain-messaging';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DialectWalletAdapterDecorator } from '../../internal/dialect-wallet-adapter';

describe('On chain messaging (e2e)', () => {
  let walletAdapter1: DialectWalletAdapterDecorator;
  let wallet1Messaging: Messaging;

  let walletAdapter2: DialectWalletAdapterDecorator;
  let wallet2Messaging: Messaging;

  beforeEach(async () => {
    walletAdapter1 = new DialectWalletAdapterDecorator(
      EmbeddedDialectWalletAdapter.create(),
    );
    const wallet1Program = await createDialectProgram(walletAdapter1);
    const airDropRequest1 =
      await wallet1Program.provider.connection.requestAirdrop(
        walletAdapter1.publicKey,
        LAMPORTS_PER_SOL * 100,
      );
    await wallet1Program.provider.connection.confirmTransaction(
      airDropRequest1,
    );
    wallet1Messaging = new OnChainMessaging(walletAdapter1, wallet1Program);
    walletAdapter2 = new DialectWalletAdapterDecorator(
      EmbeddedDialectWalletAdapter.create(),
    );
    const wallet2Decorator = new DialectWalletAdapterDecorator(walletAdapter2);
    const wallet2Program = await createDialectProgram(wallet2Decorator);
    wallet2Messaging = new OnChainMessaging(wallet2Decorator, wallet2Program);
    const airDropRequest2 =
      await wallet2Program.provider.connection.requestAirdrop(
        walletAdapter2.publicKey,
        LAMPORTS_PER_SOL * 100,
      );
    await wallet2Program.provider.connection.confirmTransaction(
      airDropRequest2,
    );
  });

  test('can list all dialects', async () => {
    // when
    const dialects = await wallet1Messaging.findAll();
    // then
    expect(dialects).toMatchObject([]);
  });

  test('can create dialect', async () => {
    // given
    const before = await wallet1Messaging.findAll();
    expect(before).toMatchObject([]);
    // when
    const command: CreateDialectCommand = {
      encrypted: false,
      me: {
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
      otherMember: {
        publicKey: walletAdapter2.publicKey,
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
    };
    const dialect = await wallet1Messaging.create(command);
    // then
    expect(dialect).not.toBeNull();
  });

  test('admin can delete dialect', async () => {
    // given
    const command: CreateDialectCommand = {
      encrypted: false,
      me: {
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
      otherMember: {
        publicKey: walletAdapter2.publicKey,
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
    };
    const dialect = await wallet1Messaging.create(command);
    const actual = await wallet2Messaging.find(dialect);
    expect(actual).not.toBe(null);
    await dialect.delete();
    const afterDeletion = await wallet2Messaging.find(dialect);
    expect(afterDeletion).toBe(null);
  });

  test('can list all dialects after creating', async () => {
    // given
    const command: CreateDialectCommand = {
      encrypted: false,
      me: {
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
      otherMember: {
        publicKey: walletAdapter2.publicKey,
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
    };
    await wallet1Messaging.create(command);
    const wallet1Dialects = await wallet1Messaging.findAll();
    const wallet2Dialects = await wallet1Messaging.findAll();
    expect(wallet1Dialects.length).toBe(1);
    expect(wallet2Dialects.length).toBe(1);
  });

  test('can send/read message with unencrypted dialect', async () => {
    // given
    const command: CreateDialectCommand = {
      encrypted: false,
      me: {
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
      otherMember: {
        publicKey: walletAdapter2.publicKey,
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
    };
    // when
    const wallet1Dialect = await wallet1Messaging.create(command);
    const wallet2Dialect = (await wallet2Messaging.find(wallet1Dialect))!;
    await wallet1Dialect.send({
      text: 'Hello world 💬',
    });
    await wallet2Dialect.send({
      text: 'Hello',
    });
    // // then
    const wallet1Messages = await wallet1Dialect.messages();
    const wallet2Messages = await wallet2Dialect.messages();
    console.log(wallet1Messages);
    expect(wallet1Messages.length).toBe(2);
    expect(wallet2Messages.length).toBe(2);
    expect(new Set(wallet1Messages)).toMatchObject(new Set(wallet2Messages));
  });

  test('can send/read message with encrypted dialect when wallet supports encryption', async () => {
    // given
    const command: CreateDialectCommand = {
      encrypted: true,
      me: {
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
      otherMember: {
        publicKey: walletAdapter2.publicKey,
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
    };
    // when
    const wallet1Dialect = await wallet1Messaging.create(command);
    const wallet2Dialect = (await wallet2Messaging.find(wallet1Dialect))!;
    await wallet1Dialect.send({
      text: 'Hello world 💬',
    });
    // then
    const wallet1Messages = await wallet1Dialect.messages();
    const wallet2Messages = await wallet2Dialect.messages();
    console.log(wallet1Messages);
    expect(new Set(wallet1Messages)).toMatchObject(new Set(wallet2Messages));
  });

  test('can send/read message with encrypted dialect when wallet supports encryption', async () => {
    // given
    // @ts-ignore
    walletAdapter2.diffieHellman = undefined;
    const command: CreateDialectCommand = {
      encrypted: true,
      me: {
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
      otherMember: {
        publicKey: walletAdapter2.publicKey,
        scopes: [DialectMemberScope.ADMIN, DialectMemberScope.WRITE],
      },
    };
    // when
    const wallet1Dialect = await wallet1Messaging.create(command);
    const wallet2Dialect = (await wallet2Messaging.find(wallet1Dialect))!;
    await wallet1Dialect.send({
      text: 'Hello world 💬',
    });
    // then
    const wallet1Messages = await wallet1Dialect.messages();
    const wallet2Messages = await wallet2Dialect.messages();
    console.log(wallet1Messages);
    expect(new Set(wallet1Messages)).not.toMatchObject(
      new Set(wallet2Messages),
    );
  });
});
