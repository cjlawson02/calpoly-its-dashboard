import {
    app, BrowserWindow, ipcMain,
} from 'electron';
import * as path from 'path';
import { AlertLevel } from './util/alert';

import AlertHandler from './util/alerthandler';
import SlackHandler from './util/slack';

const { SLACK_TOKEN } = process.env;

let mainWindow: BrowserWindow;
const alertHandler = new AlertHandler();
// const slackHandler = new SlackHandler(alertHandler, SLACK_TOKEN); // commented out until we get a token

async function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    enum DashState {
        opening,
        closing,
        loop,
        alert,
        none
    }

    let currentState = DashState.none;
    let prevState = DashState.none;
    let urlCount = 0;

    const urls = [
        'http://solidus.calpoly.edu/WebApps/ContactCenter/WallDisplayScreens/Display?current=s458263',
        'https://dashboard.capenetworks.com',
        'https://calpoly.atlassian.net/secure/Dashboard.jspa?selectPageId=10190',
    ];

    // To setup JIRA or Aruba, uncomment the respective choice and comment out the setInterval block
    // mainWindow.loadURL('https://dashboard.capenetworks.com'); // Aruba
    // mainWindow.loadURL('https://calpoly.atlassian.net/secure/Dashboard.jspa?selectPageId=10190'); // JIRA

    setInterval(() => {
        // Set state accordingly for opening/closing/alert/loop
        const minute = (new Date()).getMinutes();
        const hour = (new Date()).getHours();
        const currentAlert = alertHandler.getCurrentAlert();

        if (currentAlert) {
            currentState = DashState.alert;
        } else if (hour === 8 && minute < 15) {
            currentState = DashState.opening;
        } else if (hour === 16 && minute > 50) {
            currentState = DashState.closing;
        } else {
            currentState = DashState.loop;
        }

        // Choose what to diplay
        switch (currentState) {
        case DashState.opening:
            if (prevState !== DashState.opening) mainWindow.loadFile(path.join(__dirname, '../src/html/open.html'));
            prevState = DashState.opening;
            break;
        case DashState.closing:
            if (prevState !== DashState.closing) mainWindow.loadFile(path.join(__dirname, '../src/html/close.html'));
            prevState = DashState.closing;
            break;
        case DashState.loop:
            mainWindow.loadURL(urls[urlCount]);
            urlCount += 1;
            if (urlCount > urls.length - 1) urlCount = 0;
            prevState = DashState.loop;
            break;
        case DashState.alert:
            mainWindow.loadFile(path.join(__dirname, '../src/html/alert.html'));
            prevState = DashState.alert;
            break;
        default:
            break;
        }
    }, 10000); // Repeat every 10 seconds
}

// Send alerts info if needed
ipcMain.on('alert-page-ready', (event) => {
    if (alertHandler.getCurrentAlert()) {
        event.sender.send('alert-title', alertHandler.getCurrentAlert().getTitle().toString());
        event.sender.send('alert-desc', alertHandler.getCurrentAlert().getDescription().toString());
        event.sender.send('alert-level', alertHandler.getCurrentAlert().getLevel());
    }
});

// Slack incident checker
const incidentChannelID = 'CM8KV8A1M';
let prevMessageText: string;

// commented out until we get a token

// slackHandler.getLatestMessage(incidentChannelID).then((response) => {
//     prevMessageText = response.messages[0].text;
// });
// setInterval(() => {
//     slackHandler.getLatestMessage(incidentChannelID).then((response) => {
//         const responseText: string = response.messages[0].text;
//         if (responseText !== prevMessageText) {
//             alertHandler.raiseAlert(AlertLevel.warning, 'New Incident Raised!', responseText);
//         }
//     });
// }, 10000);

//
// Electron stuff
//

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
