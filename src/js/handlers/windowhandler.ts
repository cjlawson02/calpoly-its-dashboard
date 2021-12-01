import { BrowserWindow } from 'electron';
import * as path from 'path';

import Handler from './handler';
import AlertHandler from './alerthandler';
import HoursHandler from './hourshandler';
import { Alert } from '../util/alert';

enum DashState {
    opening,
    closing,
    loop,
    alert,
    none
}
/** Handler for the Electron Window */
export default class WindowHandler implements Handler {
    private m_alertHandler: AlertHandler;
    private m_hoursHandler: HoursHandler;
    private m_mainWindow: BrowserWindow;
    private URLS: string[];
    private WINDOW_UPDATE_TIME: number;
    private KIOSK_MODE: boolean;
    private m_prevLoopDate: Date;
    private m_currentState: DashState;
    private m_prevState: DashState;
    private m_urlCount;
    private m_prevAlert: Alert;

    /**
     * Create the window handler
     * @param alertHandler - The alert handler
     * @param hoursHandler - The hours handler
     * @param urls - An array of URLs to cycle through on the dashboard
     * @param loopTime - The time in seconds between URL changes
     */
    constructor(alertHandler: AlertHandler, hoursHandler: HoursHandler, windowUpdateTime: number, kioskMode: boolean, urls: string[]) {
        this.m_alertHandler = alertHandler;
        this.m_hoursHandler = hoursHandler;

        this.WINDOW_UPDATE_TIME = windowUpdateTime;
        this.KIOSK_MODE = kioskMode;
        this.URLS = urls;

        this.m_prevLoopDate = new Date();
        this.m_currentState = DashState.none;
        this.m_prevState = DashState.none;
        this.m_urlCount = 0;
    }

    /** Creates the main Electron window */
    async createWindow() {
        // Create the browser window.
        this.m_mainWindow = new BrowserWindow({
            kiosk: this.KIOSK_MODE,
            webPreferences: {
                nodeIntegration: false, // is default value after Electron v5
                contextIsolation: true, // protect against prototype pollution
                preload: path.join(__dirname, '../preload.js'),
            },
        });
        this.m_mainWindow.loadURL(this.URLS[this.m_urlCount]);
    }

    /**
     * Get the main Electron window
     * @returns The generated browser window
     */
    getWindow() {
        return this.m_mainWindow;
    }

    async update(date: Date) {
        // Set state accordingly for opening/closing/alert/loop
        const currentAlert = this.m_alertHandler.getCurrentAlert();

        if (currentAlert) {
            this.m_currentState = DashState.alert;
        } else if (this.m_hoursHandler.isOpeningTime()) {
            this.m_currentState = DashState.opening;
        } else if (this.m_hoursHandler.isClosingTime()) {
            // this.m_currentState = DashState.closing;
        } else {
            this.m_currentState = DashState.loop;
        }

        // Choose what to diplay
        switch (this.m_currentState) {
            case DashState.opening:
                if (this.m_prevState !== DashState.opening) this.m_mainWindow.loadFile(path.join(__dirname, '../../src/html/open.html'));
                this.m_prevState = DashState.opening;
                break;
            case DashState.closing:
                if (this.m_prevState !== DashState.closing) this.m_mainWindow.loadFile(path.join(__dirname, '../../src/html/close.html'));
                this.m_prevState = DashState.closing;
                break;
            case DashState.loop:
                if (date.getTime() - this.WINDOW_UPDATE_TIME * 1000 > this.m_prevLoopDate.getTime()) {
                    this.m_urlCount += 1;
                    if (this.m_urlCount > this.URLS.length - 1) this.m_urlCount = 0;
                    this.m_mainWindow.loadURL(this.URLS[this.m_urlCount]);
                    this.m_prevLoopDate = date;
                }
                this.m_prevState = DashState.loop;
                break;
            case DashState.alert:
                if (this.m_prevAlert !== currentAlert) this.m_mainWindow.loadFile(path.join(__dirname, '../../src/html/alert.html'));
                this.m_prevState = DashState.alert;
                this.m_prevAlert = currentAlert;
                break;
            default:
                break;
        }
    }
}
