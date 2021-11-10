import PriorityQueue from 'ts-priority-queue';
import { Alert, AlertLevel } from './alert';

export default class AlertHandler {
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
        console.log(`Alert class num: ${this.getNumAlerts()}`);
        if (this.getNumAlerts() > 0) {
            // Removed alert if cleared
            if (this.m_alerts.peek().isCleared()) {
                this.m_alerts.dequeue();
                if (this.getNumAlerts() === 0) return null;
            }
            return this.m_alerts.peek();
        }
        return null;
    }
}
