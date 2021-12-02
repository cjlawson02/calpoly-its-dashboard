import env from 'dotenv';
import { app, BrowserWindow } from 'electron';

import Handler from './handlers/handler';
import AlertHandler from './handlers/alerthandler';
import HoursHanlder from './handlers/hourshandler';
import MitelHandler from './handlers/mitelhandler';
import SlackHandler from './handlers/slackhandler';
import WindowHandler from './handlers/windowhandler';

env.config();

//
// Tunables
//

// Opening/Closing
const OPENING_WINDOW = 15; // Show opening message for 15 min after open
const CLOSING_WINDOW = 10; // Show closing message for 10 min before close

// Mitel
const ONLINE_AGENT_MINIMUM = 2; // Number of minimum agents needed, otherwise alert
const CALL_QUEUE_THRESHOLD = 2; // Maximum calls allowed in the queue, otherwise alert
const MITEL_UPDATE_TIME = 1; // How often to update the Mitel data in seconds

// Slack
const SLACK_UPDATE_TIME = 10; // How often to update Slack data in seconds
const { SLACK_TOKEN } = process.env; // Get the API token from the environment
const SLACK_INCIDENT_CHANNEL = 'CM8KV8A1M'; // Monitor this channel for incident alerts
const SLACK_DR_PEOPLESOFT_ID = 'UFP3Y0M17'; // Bot ID for the Dr. PeopleSoft bot
const SLACK_SDLEADS_GROUPID = 'S02GM5Q3CKB'; // Restrict alerts generated from a DM to only those in the @sd-leads group
const SLACK_INCIDENT_TIMEOUT = 120; // Incident alerts will be cleared after this many seconds
const SLACK_DM_TIMEOUT = 120; // DM alerts will be cleared after this many seconds

// Main Window
const URLS = [
    'http://solidus.calpoly.edu/WebApps/ContactCenter/WallDisplayScreens/Display?current=s458263',
    'https://dashboard.capenetworks.com',
    'https://calpoly.atlassian.net/secure/Dashboard.jspa?selectPageId=10190',
];
const WINDOW_UPDATE_TIME = 10; // How often the dashboard will change the URL in seconds
const KIOSK_MODE = (process.env.KIOSK_MODE === 'true');

//
// Handler setup
//

// Alert Handler
const alertHandler = new AlertHandler();

// Hours Handler
const hoursHandler = new HoursHanlder(OPENING_WINDOW, CLOSING_WINDOW);

// Mitel Handler
const mitelHandler = new MitelHandler(alertHandler, hoursHandler, MITEL_UPDATE_TIME, ONLINE_AGENT_MINIMUM, CALL_QUEUE_THRESHOLD);

// Slack Handler
const slackHandler = new SlackHandler(alertHandler, SLACK_UPDATE_TIME, SLACK_TOKEN, SLACK_INCIDENT_CHANNEL, SLACK_DR_PEOPLESOFT_ID, SLACK_SDLEADS_GROUPID, SLACK_INCIDENT_TIMEOUT, SLACK_DM_TIMEOUT);

// Window Handler
const windowHandler = new WindowHandler(alertHandler, hoursHandler, WINDOW_UPDATE_TIME, KIOSK_MODE, URLS);

// Combine handlers
const handlers: Handler[] = [hoursHandler, mitelHandler, slackHandler, alertHandler, windowHandler];

async function updateHandlers(date: Date) {
    const handlerPromises = [];
    handlers.forEach((handler) => handlerPromises.push(handler.update(date)));
    await Promise.all(handlerPromises);
}

//
// Electron stuff
//

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    windowHandler.createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) windowHandler.createWindow();
    });

    setInterval(() => {
        updateHandlers(new Date());
    }, 1);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
