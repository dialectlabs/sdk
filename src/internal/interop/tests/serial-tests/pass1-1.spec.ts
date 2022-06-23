import { InteroperabilityMessagingConfig } from "@interop/interop-messaging-test-helpers";
import { CreateThreadCommand, ThreadMemberScope } from "@messaging/messaging.interface";
import { ResourceNotFoundError } from "@sdk/errors";

describe('Primary - message 1', () => {
    test('Create a thread and send a message', async () => {
        // given
        const factory = await InteroperabilityMessagingConfig.testingNow.messagingMap();
        // when
        const existing = await factory.wallet1.messaging.find({otherMembers: [factory.wallet2.adapter.publicKey]});
        if (existing != null) {
            await existing.delete();
            const deleted = await factory.wallet1.messaging.find({otherMembers: [factory.wallet2.adapter.publicKey]});
            expect(deleted).toBeNull();
        }

        // then
        const command: CreateThreadCommand = {
            encrypted: InteroperabilityMessagingConfig.testingNow.encrypted,
            me: {
                scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
            },
            otherMembers: [
                {
                publicKey: factory.wallet2.adapter.publicKey,
                scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
                },
            ],
        };
        const thread = await factory.wallet1.messaging.create(command);
        expect(thread).not.toBeNull();

        // send and verify first message
        await thread.send({text: InteroperabilityMessagingConfig.message1});
        const wallet1Messages = await thread.messages();
        expect(wallet1Messages.length).toEqual(1);
        expect(wallet1Messages.map((e) => [e.author.publicKey, e.text]))
            .toEqual([
                [factory.wallet1.adapter.publicKey, InteroperabilityMessagingConfig.message1]]);
    }, InteroperabilityMessagingConfig.timeoutDuration.as("milliseconds"));
})