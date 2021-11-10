import { WebClient, ErrorCode } from '@slack/web-api';
import AlertHandler from './alerthandler';

export default class SlackHandler {
    private m_alertHandler: AlertHandler;
    private m_client: WebClient;

    constructor(alertHandler: AlertHandler, token: string) {
        this.m_alertHandler = alertHandler;
        this.m_client = new WebClient(token);
    }

    // Find conversation ID using the conversations.list method
    async findConversation(name: string) {
        try {
            // Call the conversations.list method using the built-in WebClient
            const result = await this.m_client.conversations.list();

            for (const channel of result.channels) {
                if (channel.name === name) {
                    let conversationId = channel.id;

                    // Print result
                    console.log(`Found conversation ID: ${conversationId}`);
                    // Break from for loop
                    break;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async getLatestMessage(channelId: string) {
        // Store conversation history
        let conversationHistory;

        try {
            // Call the conversations.history method using WebClient
            const result = await this.m_client.conversations.history({
                channel: channelId,
                limit: 1,
            });

            conversationHistory = result.messages;

            // Print results
            console.log(`${conversationHistory.length} messages found in ${channelId}`);
        } catch (error) {
            console.error(error);
        }

        return conversationHistory;
    }
}
