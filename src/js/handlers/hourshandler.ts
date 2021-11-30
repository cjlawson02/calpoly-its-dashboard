import Handler from './handler';

/** Handler for managing business hours */
export default class HoursHandler implements Handler {
    private m_openHour: number;
    private m_closeHour: number;
    private m_date: Date;

    private OPENING_WINDOW: number;
    private CLOSING_WINDOW: number;

    /**
     * Create a Hour Handler
     * @param openingWindow - The number of minutes after opening to mark as "opening" time
     * @param closingWindow - The number of minutes after closing to mark as "closing" time
     */
    constructor(openingWindow: number, closingWindow: number) {
        this.m_date = new Date();

        this.OPENING_WINDOW = openingWindow;
        this.CLOSING_WINDOW = closingWindow;
    }

    /** Based on the day, set the business hours correctly */
    private updateHours() {
        switch (this.m_date.getDay()) {
        // Sunday
        case 0:
            this.m_openHour = 10;
            this.m_closeHour = 16;
            break;
            // Saturday
        case 6:
            break;
            // All week days
        default:
            this.m_openHour = 8;
            this.m_closeHour = 17;
            break;
        }
    }

    /**
     * Get the opening hour
     * @returns The opening hour
     */
    getOpenHour() {
        return this.m_openHour;
    }

    /**
     * Get the closing hour
     * @returns The closing hour
     */
    getCloseHour() {
        return this.m_closeHour;
    }

    /**
     * Check if we are after the open time in the current day
     * @returns True if after the open time, false if before.
     */
    isAfterOpen() {
        return this.m_date.getHours() >= this.getOpenHour();
    }

    /**
     * Check if we are before the close time in the current day
     * @returns True if before the close time, false if after.
     */
    isBeforeClose() {
        return this.m_date.getHours() < this.getCloseHour();
    }

    /**
     * Check if we are open
     * @returns True if open, false if closed.
     */
    isOpen() {
        if (this.m_date.getDay() !== 6) {
            if (this.isAfterOpen() && this.isBeforeClose()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if we are within the opening time
     * @returns True if opening, false if not within the window.
     */
    isOpeningTime() {
        return (this.m_date.getHours() === this.getOpenHour() && this.m_date.getMinutes() < this.OPENING_WINDOW);
    }

    /**
     * Check if we are within the closing time
     * @returns True if closing, false if not within the window.
     */
    isClosingTime() {
        return (this.m_date.getHours() === this.getCloseHour() - 1 && this.m_date.getMinutes() > (60 - this.CLOSING_WINDOW));
    }

    async update(date: Date) {
        this.m_date = date;
        this.updateHours();
    }
}
