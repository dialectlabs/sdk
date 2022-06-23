import { InteroperabilityMessagingConfig } from "@interop/interop-messaging-test-helpers";

describe('Primary - message 2', () => {
    test('Read a thread and reply to secondary\'s first message', async () => {
        // given
        const factory = await InteroperabilityMessagingConfig.testingNow.messagingMap();
        // when
        const existing = await factory.wallet1.messaging.find({otherMembers: [factory.wallet2.adapter.publicKey]});
        expect(existing).not.toBeNull();

        const existingMessages = await existing!.messages();
        expect(existingMessages.length).toEqual(2);
        expect(existingMessages.map((e) => [e.author.publicKey, e.text]))
            .toEqual([
                [factory.wallet1.adapter.publicKey, InteroperabilityMessagingConfig.message1], 
                [factory.wallet2.adapter.publicKey, InteroperabilityMessagingConfig.message2]]);

        // send and verify third message
        await existing!.send({text: InteroperabilityMessagingConfig.message3});
        const wallet2Messages = await existing!.messages();
        expect(wallet2Messages.length).toEqual(3);

        expect(wallet2Messages.map((e) => [e.author.publicKey, e.text]))
        .toEqual([
            [factory.wallet1.adapter.publicKey, InteroperabilityMessagingConfig.message1], 
            [factory.wallet2.adapter.publicKey, InteroperabilityMessagingConfig.message2], 
            [factory.wallet1.adapter.publicKey, InteroperabilityMessagingConfig.message3]]);
    }, InteroperabilityMessagingConfig.timeoutDuration.as("milliseconds"));
})