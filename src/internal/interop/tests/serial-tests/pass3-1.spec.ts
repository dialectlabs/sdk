import { InteroperabilityMessagingConfig } from "@interop/interop-messaging-test-helpers";

describe('Primary - completion', () => {
    test('Attempt to read deleted thread', async () => {
        // given
        const factory = await InteroperabilityMessagingConfig.testingNow.messagingMap();
        
        // find deleted thread
        const deleted = await factory.wallet1.messaging.find({otherMembers: [factory.wallet2.adapter.publicKey]});
        expect(deleted).toBeNull();
    }, InteroperabilityMessagingConfig.timeoutDuration.as("milliseconds"));
})