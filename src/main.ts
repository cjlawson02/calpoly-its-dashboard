import { app, BrowserWindow } from 'electron';
import * as path from 'path';

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const urls = [
    'http://solidus.calpoly.edu/WebApps/ContactCenter/WallDisplayScreens/Display?current=s458263',
    'https://dashboard.capenetworks.com',
    'https://calpoly.atlassian.net/secure/Dashboard.jspa?selectPageId=10190',
  ];

  let urlCount = 0;
  setInterval(() => {
    mainWindow.loadURL(urls[urlCount]);

    urlCount += 1;
    if (urlCount > urls.length - 1) urlCount = 0;
  }, 10000);

  // mainWindow.loadURL(urls[2]);

  mainWindow.webContents.session.webRequest.onHeadersReceived({ urls: ['*://*/*'] },
    (d, c) => {
      if (d.responseHeaders['X-Frame-Options']) {
        delete d.responseHeaders['X-Frame-Options'];
      } else if (d.responseHeaders['x-frame-options']) {
        delete d.responseHeaders['x-frame-options'];
      }

      c({ cancel: false, responseHeaders: d.responseHeaders });
    });
}

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

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
