import {
    UsergroupsUsersListResponse, UsersConversationsResponse, WebClient,
} from '@slack/web-api';
import { ConversationsHistoryResponse, Message } from '@slack/web-api/dist/response/ConversationsHistoryResponse';
import { AlertLevel } from '../util/alert';
import { MS_PER_SECOND } from '../util/constants';
import AlertHandler from './alerthandler';
import Handler from './handler';

/** Handler for Slack Monitoring */
export default class SlackHandler implements Handler {
    private m_alertHandler: AlertHandler;
    private m_client: WebClient;

    private BOT_ID: string;
    private INCIDENT_CHANNEL_ID: string;
    private DR_PEOPLESOFT_ID: string;
    private ALLOWED_USER_GROUP_LIST: UsergroupsUsersListResponse;
    private INCIDENT_TIMEOUT: number;
    private DM_TIMEOUT: number;

    private m_prevIncidentMessage: Message;
    private m_imConversations;

    private m_prevSlackDate: Date;
    private m_rateLimit: boolean;
    private SLACK_UPDATE_TIME: number;
    private SLACK_RATE_TIMEOUT = 10;

    /**
     * Create the Slack handler
     * @param alertHandler - The alert handler
     * @param token - The Slack API token
     * @param incidentChannelID - The Slack incident channel ID to watch
     * @param drPeopleSoftID - The ID for the Dr. PeopleSoft bot
     * @param allowedUserGroupID - The group ID of users allowed to DM the bot for info alerts
     * @param incidentTimeout - The number of seconds that an incident alert will be displayed
     * @param dmTimeout - The number of seconds that a DM alert will be displayed
     */
    constructor(alertHandler: AlertHandler, slackUpdateTime: number, token: string, incidentChannelID: string, drPeopleSoftID: string, allowedUserGroupID: string, incidentTimeout: number, dmTimeout: number) {
        this.m_alertHandler = alertHandler;
        this.m_client = new WebClient(token, { rejectRateLimitedCalls: true, retryConfig: { retries: 0 } });

        this.m_client.auth.test().then((res) => {
            this.BOT_ID = res.user_id;
        });
        this.INCIDENT_CHANNEL_ID = incidentChannelID;
        this.DR_PEOPLESOFT_ID = drPeopleSoftID;
        this.ALLOWED_USER_GROUP_LIST = this.getUserGroupList(allowedUserGroupID);
        this.INCIDENT_TIMEOUT = incidentTimeout;
        this.DM_TIMEOUT = dmTimeout;

        this.m_prevIncidentMessage = this.getLatestMessage(this.INCIDENT_CHANNEL_ID);
        this.m_imConversations = {};

        const dmConvos = this.getImConversations();
        if (dmConvos) {
            dmConvos.channels.forEach((channel) => {
                this.m_imConversations[channel.id] = this.getLatestMessage(channel.id);
            });
        }

        this.m_prevSlackDate = new Date();
        this.m_rateLimit = false;
        this.SLACK_UPDATE_TIME = slackUpdateTime;
    }

    /**
     * Get the latest message in a Slack channel
     * @param channelId - The Slack channel ID
     * @returns An array of size 1 containing the latest Slack message in the channel
     */
    getLatestMessage(channelId: string) {
        let result: ConversationsHistoryResponse;
        this.m_client.conversations.history({
            channel: channelId,
            limit: 1,
        }).then(() => result).catch((error) => {
            if (error.code === 'slack_webapi_rate_limited_error') {
                this.m_rateLimit = true;
            } else {
                console.error(error);
            }
        });

        if (result) {
            return result.messages[0];
        }

        return null;
    }

    /**
     * Send a message to a given channel ID
     * @param channelId - The channel ID to send the message to
     * @param message - The message text
     */
    sendMessage(channelId: string, message: string) {
        this.m_client.chat.postMessage({
            channel: channelId,
            attachments: [{ text: message }],
        }).catch((error) => {
            if (error.code === 'slack_webapi_rate_limited_error') {
                this.m_rateLimit = true;
            } else {
                console.error(error);
            }
        });
    }

    /**
     * Get the list of users in a provided user group
     * @param userGroupID - The ID for the user group
     * @returns The user group list from Slack's API.
     */
    getUserGroupList(userGroupID: string) {
        let result: UsergroupsUsersListResponse;

        this.m_client.usergroups.users.list({ usergroup: userGroupID }).then(() => result).catch((error) => {
            if (error.code === 'slack_webapi_rate_limited_error') {
                this.m_rateLimit = true;
            } else {
                console.error(error);
            }
        });

        return result;
    }

    /**
     * Get the display name for a given user
     * @param userID - The user's ID
     * @returns The display name of the user
     */
    getUserDisplayName(userID: string) {
        let result: string;

        this.m_client.users.profile.get({ user: userID }).then((response) => {
            result = response.profile.display_name;
        }).catch((error) => {
            if (error.code === 'slack_webapi_rate_limited_error') {
                this.m_rateLimit = true;
            } else {
                console.error(error);
            }
        });

        return result;
    }

    /**
     * Get the direct message conversations
     * @returns This Slack bot's direct message conversations
     */
    getImConversations() {
        let result: UsersConversationsResponse;

        this.m_client.users.conversations({ types: 'im' }).then(() => result).catch((error) => {
            if (error.code === 'slack_webapi_rate_limited_error') {
                this.m_rateLimit = true;
            } else {
                console.error(error);
            }
        });

        return result;
    }

    /** Check for new incident messages */
    async updateIncidents() {
        const message = this.getLatestMessage(this.INCIDENT_CHANNEL_ID);

        if (message !== this.m_prevIncidentMessage && message.user === this.DR_PEOPLESOFT_ID) {
            this.m_alertHandler.raiseAlert(AlertLevel.warning, 'New Incident Raised!', message.text, this.INCIDENT_TIMEOUT);
        }
        this.m_prevIncidentMessage = message;
    }

    /** Cycle through open DMs and check for new messages. Publish alerts if user in usergroup */
    updateDirectMessages() {
        const dmConvos = this.getImConversations();
        if (dmConvos) {
            dmConvos.channels.forEach((channel) => {
                const message = this.getLatestMessage(channel.id);
                if (message) {
                    // Check if message is new and not from the bot
                    if (this.m_imConversations[channel.id] !== message && message.user !== this.BOT_ID) {
                        // Check if the user is in the allowed usergroup
                        if (this.ALLOWED_USER_GROUP_LIST.users.includes(message.user)) {
                            this.m_alertHandler.raiseAlert(AlertLevel.info, message.text, `Posted by ${this.getUserDisplayName(message.user)}`, this.DM_TIMEOUT);
                            this.sendMessage(channel.id, `Message published! It will last for ${this.DM_TIMEOUT} seconds.`);
                        } else {
                            this.sendMessage(channel.id, 'You are not permitted to publish messages to this dashboard.');
                        }

                        // Update the latest message
                        this.m_imConversations[channel.id] = message;
                    }
                }
            });
        }
    }

    async update(date: Date) {
        if (date.getTime() - this.SLACK_UPDATE_TIME * MS_PER_SECOND > this.m_prevSlackDate.getTime() && !this.m_rateLimit) {
            this.updateIncidents();
            this.updateDirectMessages();
            this.m_prevSlackDate = date;
        } else if (this.m_rateLimit) {
            if (date.getTime() - this.SLACK_RATE_TIMEOUT * MS_PER_SECOND > this.m_prevSlackDate.getTime()) {
                this.m_rateLimit = false;
                this.m_prevSlackDate = date;
            }
        }
    }
}
