import { InteroperabilityMessagingConfig } from "@interop/interop-messaging-test-helpers";

describe('Secondary - message 1', () => {
    test('Read a thread and reply to primary\'s first message', async () => {
        // given
        const factory = await InteroperabilityMessagingConfig.testingNow.messagingMap();
        // when
        const existing = await factory.wallet2.messaging.find({otherMembers: [factory.wallet1.adapter.publicKey]});
        expect(existing).not.toBeNull();

        const existingMessages = await existing!.messages();

        expect(existingMessages.length).toEqual(1);
        expect(existingMessages.map((e) => [e.author.publicKey, e.text]))
            .toEqual([[factory.wallet1.adapter.publicKey, InteroperabilityMessagingConfig.message1]]);

        // send and verify second message
        await existing!.send({text: InteroperabilityMessagingConfig.message2});
        const wallet2Messages = await existing!.messages();

        expect(wallet2Messages.length).toEqual(2);
        expect(wallet2Messages.map((e) => [e.author.publicKey, e.text]))
            .toEqual([
                [factory.wallet1.adapter.publicKey, InteroperabilityMessagingConfig.message1], 
                [factory.wallet2.adapter.publicKey, InteroperabilityMessagingConfig.message2]]);
    }, InteroperabilityMessagingConfig.timeoutDuration.as("milliseconds"));
})