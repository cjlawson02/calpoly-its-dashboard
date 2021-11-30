import { ipcMain } from 'electron';
import PriorityQueue from 'ts-priority-queue';
import { Alert, AlertLevel } from '../util/alert';
import Handler from './handler';

/** A handler for the alert system */
export default class AlertHandler implements Handler {
    /**
     * Create an Alert Handler
     */
    constructor() {
        // Send alerts info if needed
        ipcMain.on('alert-page-ready', (event) => {
            if (this.getCurrentAlert()) {
                event.sender.send('alert-title', this.getCurrentAlert().getTitle().toString());
                event.sender.send('alert-desc', this.getCurrentAlert().getDescription().toString());
                event.sender.send('alert-level', this.getCurrentAlert().getLevel());
            }
        });
    }

    private m_alerts = new PriorityQueue({
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

    /**
     * Raise a new alert
     * @param level - The level of severity
     * @param title - The title for the alert
     * @param description - The description for the alert
     * @param timeout - The timeout period in seconds
     * @returns The newly created alert
     */
    raiseAlert(level: AlertLevel, title: String, description: String, timeout?: number): Alert {
        let alert: Alert;

        if (timeout) {
            alert = new Alert(level, title, description, timeout * 1000);
        } else {
            alert = new Alert(level, title, description, null);
        }

        this.m_alerts.queue(alert);
        return alert;
    }

    /**
     * Get the number of active alerts
     * @returns The number of active alerts in the priority queue
     */
    getNumAlerts() { return this.m_alerts.length; }

    /**
     * Get the current alert
     * @returns The alert at the top of the priority queue
     */
    getCurrentAlert(): Alert {
        if (this.getNumAlerts() > 0) {
            return this.m_alerts.peek();
        }
        return null;
    }

    async update(date: Date) {
        if (this.getCurrentAlert()) {
            const alert = this.getCurrentAlert();
            const timeoutTimestamp = alert.getTimestamp().getTime() + alert.getTimeout();

            if (date.getTime() > timeoutTimestamp && alert.getTimeout()) {
                alert.clear();
            }

            if (alert.isCleared()) {
                this.m_alerts.dequeue();
            }
        }
    }
}
