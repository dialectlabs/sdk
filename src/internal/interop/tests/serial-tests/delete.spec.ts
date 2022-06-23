import { InteroperabilityMessagingConfig } from "@interop/interop-messaging-test-helpers";

describe('Delete', () => {
    test('Delete existing thread', async () => {
        // given
        const factory = await InteroperabilityMessagingConfig.testingNow.messagingMap();
        // when
        var existing = await factory.wallet1.messaging.find({otherMembers: [factory.wallet2.adapter.publicKey]});
        console.log(existing == null ? "Already deleted": "Not yet deleted");
        if (existing != null) {
            await existing.delete();
            existing = await factory.wallet1.messaging.find({otherMembers: [factory.wallet2.adapter.publicKey]});
        }
        expect(existing).toBeNull();
    }, InteroperabilityMessagingConfig.timeoutDuration.as("milliseconds"));
})