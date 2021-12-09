import env from 'dotenv';

env.config();

//
// Tunables, edit below. Ones with process.env shouldn't be touched
//

/** Configuration */
export default {
    //
    // Window operation
    //
    /** Show opening message for x minutes after open */
    openingWindow: 15,
    /** Show closing message for x minutes before close */
    closingWindow: 10,
    /** How often the dashboard will change the URL in seconds */
    windowUpdateTime: 10,
    /** The URLs the dashboard will cycle through */
    urls: [
        'http://solidus.calpoly.edu/WebApps/ContactCenter/WallDisplayScreens/Display?current=s458263',
    ],

    //
    // Mitel Tunables
    //
    /** Number of minimum agents needed, otherwise alert */
    minimumOnlineAgents: 2,
    /** Maximum calls allowed in the queue, otherwise alert */
    callQueueThreshold: 2,
    /** How often to update the Mitel data in seconds */
    mitelUpdatetime: 1,

    //
    // Slack Tunables
    //
    /** Monitor this channel for incident alerts */
    slackIncidentChannel: 'CM8KV8A1M',
    /** Bot ID for the Dr. PeopleSoft bot */
    slackDrPeopleSoftID: 'UFP3Y0M17',
    /** Restrict alerts generated from a DM to only those in the \@sd-leads group */
    slackSdLeadsGroupID: 'S02GM5Q3CKB',
    /** Incident alerts will be cleared after this many seconds */
    slackIncidentTimeout: 120,
    /** DM alerts will be cleared after this many seconds */
    slackDMTimeout: 60,

    //
    // Put these values in a .env
    //
    /** Get whether slack should be enabled from the environment */
    slackEnabled: (process.env.SLACK_ENABLED === 'true'),
    /** Get the API token from the environment */
    slackToken: process.env.SLACK_TOKEN,
    /** Get the API token from the environment */
    slackAppToken: process.env.SLACK_APP_TOKEN,
    /** Get kiosk mode from the environment */
    kioskMode: (process.env.KIOSK_MODE === 'true'),
};
