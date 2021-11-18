import { app, BrowserWindow } from 'electron';

import Handler from './util/handlers/handler';
import AlertHandler from './util/handlers/alerthandler';
import HoursHanlder from './util/handlers/hourshandler';
import MitelHandler from './util/handlers/mitelhandler';
import SlackHandler from './util/handlers/slackhandler';
import WindowHandler from './util/handlers/windowhandler';

//
// Tunables
//

// Opening/Closing
const OPENING_WINDOW = 15; // Show opening message for 15 min after open
const CLOSING_WINDOW = 10; // Show closing message for 10 min before close

// Mitel
const ONLINE_AGENT_MINIMUM = 2;
const FREE_AGENT_MINIMUM = 1;
const CALL_QUEUE_THRESHOLD = 2;

// Slack
const { SLACK_TOKEN } = process.env;
const SLACK_INCIDENT_CHANNEL = 'CM8KV8A1M';

// Main Window
const urls = [
    'http://solidus.calpoly.edu/WebApps/ContactCenter/WallDisplayScreens/Display?current=s458263',
    'https://dashboard.capenetworks.com',
    'https://calpoly.atlassian.net/secure/Dashboard.jspa?selectPageId=10190',
];

// To setup JIRA or Aruba, set setup to true and uncomment the respective choice
const setup = false;
// windowHandler.getWindow().loadURL('https://dashboard.capenetworks.com'); // Aruba
// windowHandler.getWindow().loadURL('https://calpoly.atlassian.net/secure/Dashboard.jspa?selectPageId=10190'); // JIRA

//
// Handler setup
//

// Alert Handler
const alertHandler = new AlertHandler();

// Hours Handler
const hoursHandler = new HoursHanlder(OPENING_WINDOW, CLOSING_WINDOW);

// Mitel Handler
const mitelHandler = new MitelHandler(alertHandler, hoursHandler, ONLINE_AGENT_MINIMUM, FREE_AGENT_MINIMUM, CALL_QUEUE_THRESHOLD);

// Slack Handler
// const slackHandler = new SlackHandler(alertHandler, SLACK_TOKEN, SLACK_INCIDENT_CHANNEL); // commented out until we get a token

// Window Handler
const windowHandler = new WindowHandler(alertHandler, hoursHandler, urls);

// Combine handlers
const handlers: Handler[] = [hoursHandler, mitelHandler, alertHandler, windowHandler];

//
// Electron stuff
//

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    windowHandler.createWindow();

    if (!setup) {
        handlers.forEach((handler) => handler.update());
        setInterval(() => {
            handlers.forEach((handler) => handler.update());
        }, 10000); // Repeat every 10 seconds
    }

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) windowHandler.createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
