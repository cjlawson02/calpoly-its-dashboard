export enum AlertLevel {
    info = 0,
    warning = 1,
    critical = 2
}

export class Alert {
    private m_level: AlertLevel;
    private m_title: String;
    private m_description: String;
    private m_cleared: boolean;
    private m_timestamp: Date;

    constructor(level: AlertLevel, title: String, description: String) {
        this.m_level = level;
        this.m_title = title;
        this.m_description = description;
        this.m_cleared = false;
        this.m_timestamp = new Date();
    }

    public getLevel() { return this.m_level; }
    public getTitle() { return this.m_title; }
    public getDescription() { return this.m_description; }
    public getTimestamp() { return this.m_timestamp; }

    public clear() { this.m_cleared = true; }
    public isCleared() { return this.m_cleared; }
}
