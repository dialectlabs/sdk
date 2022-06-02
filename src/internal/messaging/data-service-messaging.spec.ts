import { DataServiceMessaging } from './data-service-messaging';
import { DataServiceApi } from '@data-service-api/data-service-api';
import { TokenProvider } from '@auth/internal/token-provider';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import type {
  CreateDialectCommand,
  Messaging,
} from '@messaging/messaging.interface';
import { DialectMemberScope } from '@messaging/messaging.interface';
import { DialectWalletAdapterImpl } from '@wallet-adapter/internal/dialect-wallet-adapter-impl';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/auth.interface';

describe('Data service messaging (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let walletAdapter1: DialectWalletAdapterImpl;
  let wallet1Messaging: Messaging;
  let walletAdapter2: DialectWalletAdapterImpl;
  let wallet2Messaging: Messaging;

  beforeEach(() => {
    walletAdapter1 = new DialectWalletAdapterImpl(
      NodeDialectWalletAdapter.create(),
    );
    wallet1Messaging = new DataServiceMessaging(
      walletAdapter1,
      DataServiceApi.create(
        baseUrl,
        TokenProvider.create(
          new DialectWalletAdapterEd25519TokenSigner(walletAdapter1),
        ),
      ).dialects,
    );
    walletAdapter2 = new DialectWalletAdapterImpl(
      NodeDialectWalletAdapter.create(),
    );
    wallet2Messaging = new DataServiceMessaging(
      walletAdapter2,
      DataServiceApi.create(
        baseUrl,
        TokenProvider.create(
          new DialectWalletAdapterEd25519TokenSigner(walletAdapter2),
        ),
      ).dialects,
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
    // then
    const wallet1Messages = await wallet1Dialect.messages();
    const wallet2Messages = await wallet2Dialect.messages();
    console.log(wallet1Messages);
    expect(wallet1Messages.length).toBe(2);
    expect(wallet2Messages.length).toBe(2);
    expect(new Set(wallet1Messages)).toMatchObject(new Set(wallet2Messages));
  });

  test('can send/read message with encrypted dialect when wallet-adapter supports encryption', async () => {
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

  test('can send/read message with encrypted dialect when wallet-adapter supports encryption', async () => {
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