import { App } from '@slack/bolt';
import { Alert, AlertLevel } from '../util/alert';
import AlertHandler from './alerthandler';
import Handler from './handler';

/** Handler for Slack Monitoring */
export default class SlackHandler implements Handler {
    private m_alertHandler: AlertHandler;
    private m_bolt: App;

    private INCIDENT_CHANNEL_ID: string;
    private DR_PEOPLESOFT_ID: string;
    private ALLOWED_USER_LIST: string[];
    private INCIDENT_TIMEOUT: number;
    private DM_TIMEOUT: number;

    private m_currentSlackAlert: Alert;

    /**
     * Create the Slack handler
     * @param alertHandler - The alert handler
     * @param token - The Slack Bot API token
     * @param appToken - The Slack App API token
     * @param incidentChannelID - The Slack incident channel ID to watch
     * @param drPeopleSoftID - The ID for the Dr. PeopleSoft bot
     * @param allowedUserGroupID - The group ID of users allowed to DM the bot for info alerts
     * @param incidentTimeout - The number of seconds that an incident alert will be displayed
     * @param dmTimeout - The number of seconds that a DM alert will be displayed
     */
    constructor(alertHandler: AlertHandler, token: string, appToken: string, incidentChannelID: string, drPeopleSoftID: string, allowedUserGroupID: string, incidentTimeout: number, dmTimeout: number) {
        this.m_alertHandler = alertHandler;
        this.m_bolt = new App({
            token,
            appToken,
            socketMode: true,
        });

        (async () => {
            await this.m_bolt.start();
        })();

        this.INCIDENT_CHANNEL_ID = incidentChannelID;
        this.DR_PEOPLESOFT_ID = drPeopleSoftID;

        this.getUserGroupList(allowedUserGroupID).then((result) => {
            if (result) {
                this.ALLOWED_USER_LIST = result.users;
            }
        });

        this.INCIDENT_TIMEOUT = incidentTimeout;
        this.DM_TIMEOUT = dmTimeout;

        this.m_currentSlackAlert = null;

        this.m_bolt.message(async ({ event, say, logger }) => {
            try {
                if (event.channel_type === 'im') {
                    if (!await this.handleIm(event)) {
                        await say('You are not permitted to post alerts on this system.');
                    }
                } else if (event.channel_type === 'channel') {
                    if (event.channel === this.INCIDENT_CHANNEL_ID) {
                        await this.handleIncident(event);
                    }
                }
            } catch (error) {
                logger.error(error);
            }
        });
    }

    /**
     * Get the list of users in a provided user group
     * @param userGroupID - The ID for the user group
     * @returns The user group list from Slack's API.
     */
    async getUserGroupList(userGroupID: string) {
        const result = await this.m_bolt.client.usergroups.users.list({ usergroup: userGroupID }).catch((error) => {
            console.error(error);
        });

        if (result) {
            return result;
        }

        return null;
    }

    /**
     * Get the display name for a given user
     * @param userID - The user's ID
     * @returns The display name of the user
     */
    async getUserDisplayName(userID: string) {
        const result = await this.m_bolt.client.users.profile.get({ user: userID }).catch((error) => {
            console.error(error);
        });

        if (result) {
            return result.profile.display_name;
        }

        return null;
    }

    /** Check for new incident messages */
    async handleIncident(event) {
        if (event.user === this.DR_PEOPLESOFT_ID) {
            this.m_alertHandler.raiseAlert(AlertLevel.warning, 'New Incident Raised!', event.text, this.INCIDENT_TIMEOUT);

            // React to message to show alert was made
            await this.m_bolt.client.reactions.add({
                channel: event.channel,
                name: 'thumbsup',
                timestamp: event.event_ts,
            });

            return true;
        }

        return false;
    }

    /** Cycle through open DMs and check for new messages. Publish alerts if user in usergroup */
    async handleIm(event) {
        if (this.ALLOWED_USER_LIST.includes(event.user)) {
            // Clear the old alert if there was one
            if (this.m_currentSlackAlert) {
                this.m_currentSlackAlert.clear();
            }

            // Create a new alert
            this.m_currentSlackAlert = this.m_alertHandler.raiseAlert(AlertLevel.info, event.text, `Posted by ${await this.getUserDisplayName(event.user)}`, this.DM_TIMEOUT);

            // React to message to show alert was made
            await this.m_bolt.client.reactions.add({
                channel: event.channel,
                name: 'thumbsup',
                timestamp: event.event_ts,
            });

            return true;
        }

        // React to message to show alert was not allowed
        await this.m_bolt.client.reactions.add({
            channel: event.channel,
            name: 'x',
            timestamp: event.event_ts,
        });

        return false;
    }

    async update(date: Date) {
        // Remove current alert if cleared
        if (this.m_currentSlackAlert) {
            if (this.m_currentSlackAlert.isCleared()) {
                this.m_currentSlackAlert = null;
            }
        }
    }
}
