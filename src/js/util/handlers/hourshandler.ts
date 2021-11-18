import Handler from './handler';

export default class HoursHandler extends Handler {
    private m_openHour: number;
    private m_closeHour: number;
    private m_date: Date;

    private OPENING_WINDOW: number;
    private CLOSING_WINDOW: number;

    constructor(openingWindow: number, closingWindow: number) {
        super();
        this.m_date = new Date();

        this.OPENING_WINDOW = openingWindow;
        this.CLOSING_WINDOW = closingWindow;
    }

    private updateHours() {
        switch (this.m_date.getDay()) {
        case 0:
            this.m_openHour = 10;
            this.m_closeHour = 16;
            break;
        case 6:
            break;
        default:
            this.m_openHour = 8;
            this.m_closeHour = 17;
            break;
        }
    }

    getOpenHour() {
        this.updateHours();
        return this.m_openHour;
    }

    getCloseHour() {
        this.updateHours();
        return this.m_closeHour;
    }

    isAfterOpen() {
        return this.m_date.getHours() >= this.getOpenHour();
    }

    isBeforeClose() {
        return this.m_date.getHours() < this.getCloseHour();
    }

    isOpen() {
        if (this.m_date.getDay() !== 6) {
            if (this.isAfterOpen() && this.isBeforeClose()) {
                return true;
            }
        }
        return false;
    }

    isOpeningTime() {
        return (this.m_date.getHours() === this.getOpenHour() && this.m_date.getMinutes() < this.OPENING_WINDOW);
    }

    isClosingTime() {
        return (this.m_date.getHours() === this.getCloseHour() && this.m_date.getMinutes() > (60 - this.CLOSING_WINDOW));
    }

    update() {
        this.m_date = new Date();
        this.updateHours();
    }
}
