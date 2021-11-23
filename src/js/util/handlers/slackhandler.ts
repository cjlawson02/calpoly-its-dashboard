import { WebClient } from '@slack/web-api';
import { Message } from '@slack/web-api/dist/response/ConversationsHistoryResponse';
import { AlertLevel } from '../alert';
import AlertHandler from './alerthandler';
import Handler from './handler';

/** Handler for Slack Monitoring */
export default class SlackHandler implements Handler {
    private m_alertHandler: AlertHandler;
    private m_client: WebClient;
    private m_channelID: string;
    private m_prevMessageText: string;

    /**
     * Create the Slack handler
     * @param alertHandler - The alert handler
     * @param token - The Slack API token
     * @param channelID - The Slack channel ID to watch
     */
    constructor(alertHandler: AlertHandler, token: string, channelID: string) {
        this.m_alertHandler = alertHandler;
        this.m_client = new WebClient(token);
        this.m_channelID = channelID;
        this.getLatestMessage(this.m_channelID).then((response) => {
            this.m_prevMessageText = response.messages[0].text;
        });
    }

    /**
     * Find conversation ID using the conversations.list method
     * @param name - The channel name to find
     */
    async findConversation(name: string) {
        try {
            // Call the conversations.list method using the built-in WebClient
            const result = await this.m_client.conversations.list();

            result.channels.forEach((channel) => {
                if (channel.name === name) {
                    const conversationId = channel.id;

                    // Print result
                    console.log(`Found conversation ID: ${conversationId}`);
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Get the latest message in a Slack channel
     * @param channelId - The Slack channel ID
     * @returns An array of size 1 containing the latest Slack message in the channel
     */
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

    async update() {
        this.getLatestMessage(this.m_channelID).then((response) => {
            const responseText: string = response.messages[0].text;
            if (responseText !== this.m_prevMessageText) {
                this.m_alertHandler.raiseAlert(AlertLevel.warning, 'New Incident Raised!', responseText);
            }
        });
    }
}
