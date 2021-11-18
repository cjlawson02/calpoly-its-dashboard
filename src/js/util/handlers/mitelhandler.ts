import request from 'request';

import Handler from './handler';
import { Alert, AlertLevel } from '../alert';
import AlertHandler from './alerthandler';
import HoursHandler from './hourshandler';

export default class MitelHandler extends Handler {
    private m_alertHandler: AlertHandler;
    private m_hoursHandler: HoursHandler;

    private ONLINE_AGENT_MINIMUM: number;
    private m_onlineAgentNum: number;
    private m_currentOnlineAgentAlert: Alert;

    private FREE_AGENT_MINIMUM: number;
    private m_freeAgentNum: number;
    private m_currentFreeAgentAlert: Alert;

    private QUEUE_THRESHOLD: number;
    private m_queueNum: number;
    private m_prevQueueNum: number;
    private m_currentQueueAlert: Alert;

    constructor(alertHandler: AlertHandler, hoursHandler: HoursHandler, agentMinimum: number, freeMinimum: number, queueThreshold: number) {
        super();
        this.m_alertHandler = alertHandler;
        this.m_hoursHandler = hoursHandler;

        this.ONLINE_AGENT_MINIMUM = agentMinimum;
        this.FREE_AGENT_MINIMUM = freeMinimum;
        this.QUEUE_THRESHOLD = queueThreshold;

        this.updateMitelData();
        this.m_prevQueueNum = this.m_queueNum;
    }

    async updateMitelData() {
        const options = {
            url: 'http://solidus.calpoly.edu/WebApps/Api/RealTime/PanelData?screenID=3',
            headers: {
                Referer: 'http://solidus.calpoly.edu/WebApps/ContactCenter/WallDisplayScreens/Display?current=s458263',
            },
        };

        request(options, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const dashData = JSON.parse(body);

                this.m_queueNum = dashData[0].Data[0]['Calls in queue'];
                this.m_onlineAgentNum = dashData[3].Data[0]['Logged on agents'];
                this.m_freeAgentNum = dashData[3].Data[0]['Free agents'];
            }
        });
    }

    getCallsInQueue() {
        return this.m_queueNum;
    }

    handleAgentAlerts() {
        if (this.m_onlineAgentNum <= this.ONLINE_AGENT_MINIMUM) {
            if (!this.m_currentOnlineAgentAlert) this.m_currentOnlineAgentAlert = this.m_alertHandler.raiseAlert(AlertLevel.critical, 'Not enough agents logged in!', 'There are not enough phone agents logged in. Please get some people on the phones');
        } else if (this.m_currentOnlineAgentAlert) {
            this.m_currentOnlineAgentAlert.clear();
        }
    }

    handleFreeAlerts() {
        if (this.m_freeAgentNum <= this.FREE_AGENT_MINIMUM) {
            if (!this.m_currentFreeAgentAlert) this.m_currentFreeAgentAlert = this.m_alertHandler.raiseAlert(AlertLevel.warning, 'Not enough agents available!', 'There are not enough phone agents free to take calls. Please get some people on the phones');
        } else if (this.m_currentFreeAgentAlert) {
            this.m_currentFreeAgentAlert.clear();
        }
    }

    handleQueueAlerts() {
        if (this.m_queueNum > this.QUEUE_THRESHOLD) {
            if (!this.m_currentQueueAlert) {
                this.m_currentQueueAlert = this.m_alertHandler.raiseAlert(AlertLevel.critical, `${this.m_queueNum} calls in queue!`, 'Please get some people on the phones');
                this.m_prevQueueNum = this.m_queueNum;
            } else if (this.m_currentQueueAlert && this.m_prevQueueNum !== this.m_queueNum) {
                this.m_currentQueueAlert.clear();
                this.m_currentQueueAlert = this.m_alertHandler.raiseAlert(AlertLevel.critical, `${this.m_queueNum} calls in queue!`, 'Please get some people on the phones');
                this.m_prevQueueNum = this.m_queueNum;
            }
        } else if (this.m_currentQueueAlert) this.m_currentQueueAlert.clear();
    }

    handleAlerts() {
        // Forget cleared alerts
        if (this.m_currentQueueAlert) if (this.m_currentQueueAlert.isCleared()) this.m_currentQueueAlert = null;
        if (this.m_currentOnlineAgentAlert) if (this.m_currentOnlineAgentAlert.isCleared()) this.m_currentOnlineAgentAlert = null;
        if (this.m_currentFreeAgentAlert) if (this.m_currentFreeAgentAlert.isCleared()) this.m_currentFreeAgentAlert = null;

        if (this.m_hoursHandler.isOpen() && !this.m_hoursHandler.isClosingTime()) {
            this.handleAgentAlerts();
            // Number of logged in agents is more important than number free, so only check if needed
            if (!this.m_currentOnlineAgentAlert) this.handleFreeAlerts();
            this.handleQueueAlerts();
        }
    }

    update() {
        this.updateMitelData();
        this.handleAlerts();
    }
}
