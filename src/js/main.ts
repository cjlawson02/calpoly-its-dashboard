import { app, BrowserWindow } from 'electron';

import config from '../../config';
import Handler from './handlers/handler';
import AlertHandler from './handlers/alerthandler';
import HoursHanlder from './handlers/hourshandler';
import MitelHandler from './handlers/mitelhandler';
import SlackHandler from './handlers/slackhandler';
import WindowHandler from './handlers/windowhandler';

//
// Handler setup
//

// Alert Handler
const alertHandler = new AlertHandler();

// Hours Handler
const hoursHandler = new HoursHanlder(config.openingWindow, config.closingWindow);

// Mitel Handler
const mitelHandler = new MitelHandler(alertHandler, hoursHandler, config.mitelUpdatetime, config.minimumOnlineAgents, config.callQueueThreshold);

// Slack Handler
const slackHandler = new SlackHandler(config.slackEnabled, alertHandler, config.slackAppToken, config.slackAppToken, config.slackIncidentChannel, config.slackDrPeopleSoftID, config.slackSdLeadsGroupID, config.slackIncidentTimeout, config.slackDMTimeout);

// Window Handler
const windowHandler = new WindowHandler(alertHandler, hoursHandler, config.windowUpdateTime, config.kioskMode, config.urls);

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
