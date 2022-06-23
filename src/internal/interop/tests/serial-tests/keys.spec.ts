import { primaryKeyPair, secondaryKeyPair } from "@interop/interop-keypairs";
import { InteroperabilityMessagingConfig } from "@interop/interop-messaging-test-helpers";

describe('Keys', () => {
    test('Print given keys', async () => {
        const primary = primaryKeyPair;
        const secondary = secondaryKeyPair;
        console.log("KEYS:", primaryKeyPair.publicKey.toBase58(), secondaryKeyPair.publicKey.toBase58());
    }, InteroperabilityMessagingConfig.timeoutDuration.as("milliseconds"));
})