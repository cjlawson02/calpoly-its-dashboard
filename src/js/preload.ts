// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

import { ipcRenderer } from 'electron';
import { AlertLevel } from './util/alert';

const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
        element.innerText = text;
    }
};

ipcRenderer.on('alert-title', (event, response) => {
    replaceText('alert-title', response);
});

ipcRenderer.on('alert-desc', (event, response) => {
    replaceText('alert-description', response);
});

ipcRenderer.on('alert-level', (event, response: AlertLevel) => {
    const body = document.getElementById('body');
    switch (response) {
    case AlertLevel.info:
        body.classList.add('bg-info');
        break;
    case AlertLevel.warning:
        body.classList.add('bg-warning');
        break;
    case AlertLevel.critical:
        body.classList.add('bg-danger');
        break;
    default:
        break;
    }
});

window.addEventListener('DOMContentLoaded', () => {
    if (window.location.href.includes('alert.html')) {
        ipcRenderer.send('alert-page-ready', true);
    }
});
