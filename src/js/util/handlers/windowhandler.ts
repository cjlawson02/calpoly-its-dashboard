import { BrowserWindow } from 'electron';
import * as path from 'path';

import Handler from './handler';
import AlertHandler from './alerthandler';
import HoursHandler from './hourshandler';
import { Alert } from '../alert';

enum DashState {
    opening,
    closing,
    loop,
    alert,
    none
}

export default class WindowHandler extends Handler {
    private m_alertHandler: AlertHandler;
    private m_hoursHandler: HoursHandler;
    private m_mainWindow: BrowserWindow;
    private m_urls: string[];
    private m_currentState: DashState;
    private m_prevState: DashState;
    private m_urlCount;
    private m_prevAlert: Alert;

    constructor(alertHandler: AlertHandler, hoursHandler: HoursHandler, urls: string[]) {
        super();
        this.m_alertHandler = alertHandler;
        this.m_hoursHandler = hoursHandler;
        this.m_urls = urls;
        this.m_currentState = DashState.none;
        this.m_prevState = DashState.none;
        this.m_urlCount = 0;
    }

    async createWindow() {
        // Create the browser window.
        this.m_mainWindow = new BrowserWindow({
            kiosk: true,
            webPreferences: {
                nodeIntegration: false, // is default value after Electron v5
                contextIsolation: true, // protect against prototype pollution
                preload: path.join(__dirname, '../../preload.js'),
            },
        });
    }

    getWindow() {
        return this.m_mainWindow;
    }

    update() {
        // Set state accordingly for opening/closing/alert/loop
        const currentAlert = this.m_alertHandler.getCurrentAlert();

        if (currentAlert) {
            this.m_currentState = DashState.alert;
        } else if (this.m_hoursHandler.isOpeningTime()) {
            this.m_currentState = DashState.opening;
        } else if (this.m_hoursHandler.isClosingTime()) {
            this.m_currentState = DashState.closing;
        } else {
            this.m_currentState = DashState.loop;
        }

        // Choose what to diplay
        switch (this.m_currentState) {
        case DashState.opening:
            if (this.m_prevState !== DashState.opening) this.m_mainWindow.loadFile(path.join(__dirname, '../../../src/html/open.html'));
            this.m_prevState = DashState.opening;
            break;
        case DashState.closing:
            if (this.m_prevState !== DashState.closing) this.m_mainWindow.loadFile(path.join(__dirname, '../../../src/html/close.html'));
            this.m_prevState = DashState.closing;
            break;
        case DashState.loop:
            this.m_mainWindow.loadURL(this.m_urls[this.m_urlCount]);
            this.m_urlCount += 1;
            if (this.m_urlCount > this.m_urls.length - 1) this.m_urlCount = 0;
            this.m_prevState = DashState.loop;
            break;
        case DashState.alert:
            if (this.m_prevAlert !== currentAlert) this.m_mainWindow.loadFile(path.join(__dirname, '../../../src/html/alert.html'));
            this.m_prevState = DashState.alert;
            this.m_prevAlert = currentAlert;
            break;
        default:
            break;
        }
    }
}
