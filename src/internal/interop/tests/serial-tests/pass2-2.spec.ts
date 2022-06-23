import { InteroperabilityMessagingConfig } from "@interop/interop-messaging-test-helpers";

describe('Secondary - message 2', () => {
    test('Read a thread then delete the thread', async () => {
        // given
        const factory = await InteroperabilityMessagingConfig.testingNow.messagingMap();
        // when
        const existing = await factory.wallet2.messaging.find({otherMembers: [factory.wallet1.adapter.publicKey]});
        expect(existing).not.toBeNull();

        const existingMessages = await existing!.messages();
        expect(existingMessages.length).toEqual(3);

        expect(existingMessages.map((e) => [e.author.publicKey, e.text]))
            .toEqual([
                [factory.wallet1.adapter.publicKey, InteroperabilityMessagingConfig.message1], 
                [factory.wallet2.adapter.publicKey, InteroperabilityMessagingConfig.message2], 
                [factory.wallet1.adapter.publicKey, InteroperabilityMessagingConfig.message3]]);

        // delete thread
        await existing!.delete();
        const deleted = await factory.wallet2.messaging.find({otherMembers: [factory.wallet1.adapter.publicKey]});
        expect(deleted).toBeNull();
    }, InteroperabilityMessagingConfig.timeoutDuration.as("milliseconds"));
})