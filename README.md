# calpoly-its-dashboard

**Simple Electron App for displaying the status of Cal Poly services, phones, and tickets**

This application is used on a semi-headless Mac Mini (running Ubuntu) connected to 2 mirrored Thunderbolt displays at the Service Desk.
## Features

- Cycling dashboards (between Mitel Status, Aruba Dashboard, and a JSM Dashboard)
- Auto display on/off at open/close times (via Cronjob using [displayctl.sh](https://github.com/Chris2fourlaw/calpoly-its-dashboard/blob/main/displayctl.sh))
- Auto updating (via Cronjob using `git pull` and restarting app)
- Custom Service Desk opening/closing messages including daily checklists

## Future Features

- Alert pop-ups
  - Incident alerts through monitoring of #incidents Slack channel
  - Critical phone service issues (lack of agents)
  - Spike in recent tickets compared to baseline
- Better initial setup
  - Check if logged into Jira/Aruba before cycling through status
- A randomly selected funny cat photo at closing (Preston loves him some cat memes)
## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/Chris2fourlaw/calpoly-its-dashboard
# Go into the repository
cd calpoly-its-dashboard
# Install dependencies
npm install
# Run the app
npm start
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.
