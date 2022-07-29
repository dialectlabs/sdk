import { DataServiceApi } from './data-service-api';
import { TokenProvider } from '@auth/internal/token-provider';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/signers/ed25519-token-signer';
import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import type { DataServicePushNotificationSubscriptionsApi } from './data-service-push-notification-subscriptions-api';

describe('Data service push notification subscriptions api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let api: DataServicePushNotificationSubscriptionsApi;
  let userWallet: DialectWalletAdapterWrapper;
  const physicalId = "dd96dec43fb81c97";
  const token1 = "token1";
  const token2 = "token2";

  beforeEach(async () => {
    const dappWallet = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    userWallet = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    api = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new DialectWalletAdapterEd25519TokenSigner(userWallet),
      ),
    ).pushNotificationSubscriptions;
  });

  test('can create token', async () => {
    // given
    const physicalId = "dd96dec43fb81c97";
    const token1 = "token1";
    await expect(api.get(physicalId)).rejects.toBeTruthy();

    // when
    const pnSubscriptionUpsert = await api.upsert({
      physicalId: physicalId,
      token: token1
    });
    expect(pnSubscriptionUpsert.walletPublicKey).toEqual(userWallet.publicKey.toBase58());
    expect(pnSubscriptionUpsert.physicalId).toEqual(physicalId);
    expect(pnSubscriptionUpsert.token).toEqual(token1);

    // then
    const pnSubscriptionUpsertGet = await api.get(physicalId);
    expect(pnSubscriptionUpsertGet).toEqual(pnSubscriptionUpsert);
  });

  test('can upsert token', async () => {
    // given
    await expect(api.get(physicalId)).rejects.toBeTruthy();

    // when
    const pnSubscriptionUpsert1 = await api.upsert({
      physicalId: physicalId,
      token: token1
    });
    expect(pnSubscriptionUpsert1.walletPublicKey).toEqual(userWallet.publicKey.toBase58());
    expect(pnSubscriptionUpsert1.physicalId).toEqual(physicalId);
    expect(pnSubscriptionUpsert1.token).toEqual(token1);

    // then
    const pnSubscriptionUpsertGet1 = await api.get(physicalId);
    expect(pnSubscriptionUpsertGet1).toEqual(pnSubscriptionUpsert1);

    // when
    const pnSubscriptionUpsert2 = await api.upsert({
      physicalId: physicalId,
      token: token1
    });
    expect(pnSubscriptionUpsert2.walletPublicKey).toEqual(userWallet.publicKey.toBase58());
    expect(pnSubscriptionUpsert2.physicalId).toEqual(physicalId);
    expect(pnSubscriptionUpsert2.token).toEqual(token1);    

    // then
    const pnSubscriptionUpsertGet2 = await api.get(physicalId);
    expect(pnSubscriptionUpsertGet2).toEqual(pnSubscriptionUpsert2);
  });

  test('cannot create multiple subscriptions with the same token', async () => {
    // when
    const pnSubscriptionUpsert1 = await api.upsert({
      physicalId: physicalId,
      token: token1
    });
    
    await expect(api.upsert({
      physicalId: "temp-physical-id-2",
      token: token1
    })).rejects.toBeTruthy();
  });

  test('can create multiple subscriptions with different device and token', async () => {
    // when
    const pnSubscriptionUpsert1 = await api.upsert({
      physicalId: physicalId,
      token: token1
    });
    const pnSubscriptionUpsertGet1 = await api.get(physicalId);

    const tempPhysicalId = "temp-physical-id";
    const tempToken = "temp-token";
    const pnSubscriptionUpsert2 = await api.upsert({
      physicalId: tempPhysicalId,
      token: tempToken
    });
    const pnSubscriptionUpsertGet2 = await api.get(tempPhysicalId);

    // then
    expect(pnSubscriptionUpsert1.walletPublicKey).toEqual(userWallet.publicKey.toBase58());
    expect(pnSubscriptionUpsert1.physicalId).toEqual(physicalId);
    expect(pnSubscriptionUpsert1.token).toEqual(token1); 
    expect(pnSubscriptionUpsert1).toEqual(pnSubscriptionUpsertGet1)

    expect(pnSubscriptionUpsert2.walletPublicKey).toEqual(userWallet.publicKey.toBase58());
    expect(pnSubscriptionUpsert2.physicalId).toEqual(tempPhysicalId);
    expect(pnSubscriptionUpsert2.token).toEqual(tempToken); 
    expect(pnSubscriptionUpsert2).toEqual(pnSubscriptionUpsertGet2)
  });

  test('can delete token', async () => {
    // given
    await expect(api.get(physicalId)).rejects.toBeTruthy();

    // when
    const pnSubscriptionUpsert = await api.upsert({
      physicalId: physicalId,
      token: token1
    });
    expect(pnSubscriptionUpsert.walletPublicKey).toEqual(userWallet.publicKey.toBase58());
    expect(pnSubscriptionUpsert.physicalId).toEqual(physicalId);
    expect(pnSubscriptionUpsert.token).toEqual(token1);

    // then
    const pnSubscriptionUpsertGet = await api.get(physicalId);
    expect(pnSubscriptionUpsertGet).toEqual(pnSubscriptionUpsert);

    await api.delete(physicalId);
    await expect(api.get(physicalId)).rejects.toBeTruthy();
  });
});
