import { ipcMain } from 'electron';
import PriorityQueue from 'ts-priority-queue';
import { Alert, AlertLevel } from '../alert';
import Handler from './handler';

export default class AlertHandler extends Handler {
    constructor() {
        super();
        // Send alerts info if needed
        ipcMain.on('alert-page-ready', (event) => {
            if (this.getCurrentAlert()) {
                event.sender.send('alert-title', this.getCurrentAlert().getTitle().toString());
                event.sender.send('alert-desc', this.getCurrentAlert().getDescription().toString());
                event.sender.send('alert-level', this.getCurrentAlert().getLevel());
            }
        });
    }

    m_alerts = new PriorityQueue({
        comparator: (a: Alert, b: Alert) => {
            if (a.getLevel() > b.getLevel()) {
                return 1;
            }

            if (a.getLevel() === b.getLevel()) {
                if (a.getTimestamp() > b.getTimestamp()) {
                    return 1;
                }

                if (a.getTimestamp() === b.getTimestamp()) {
                    return 0;
                }

                return -1;
            }

            return -1;
        },
    });

    raiseAlert(level: AlertLevel, title: String, description: String): Alert {
        const alert = new Alert(level, title, description);
        this.m_alerts.queue(alert);
        return alert;
    }

    getNumAlerts() { return this.m_alerts.length; }

    getCurrentAlert(): Alert {
        if (this.getNumAlerts() > 0) {
            return this.m_alerts.peek();
        }
        return null;
    }

    update() {
        super.update();
        if (this.getNumAlerts() > 0) {
            if (this.m_alerts.peek().isCleared()) {
                this.m_alerts.dequeue();
            }
        }
    }
}
