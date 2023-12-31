# adp-plus
A Chrome Extension that adds AutoFill, AutoSave & other features to ADP TimeClock for CBU Student Workers

![](media/demo.gif)

## Features
* Automatically maximizes the timecard for easier editing. _(To return to default view, click the rectangle icon in the top right corner)_
* Right clicking on the punch time will automatically take you to comments.
* if no comment is found, ADP Plus will autofill the text box with punch in and out time, as well as the calculated number of hours
* the Enter key is bound to press the 'Ok' button on comment box
* ADP Plus will automatically save the timecard every 10 seconds

## Installation
### Chrome Web Store
1. Click [here](https://chrome.google.com/webstore/detail/adp-plus/cofodcjpapmneekccpiclhegpkehcjci?hl=en&authuser=0) to install.

### Userscript
1. Install a userscript manager like [TamperMonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [ViolentMonkey](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)
2. Click [here](https://github.com/inVariabl/adp-plus/raw/main/ADP%20Plus.user.js) to install the script

### Developer Source
1. Download the [source code](https://github.com/inVariabl/adp-plus/archive/refs/heads/main.zip) and extract it
2. Navigate to `chrome://extensions` in your browser
3. Enable 'Developer Mode'
4. Click 'Load Unpacked' and navigate to the unpacked `adp-plus/extension` folder

## Future Features
- [ ] bind 'Tab' to cycle to next empty timecard
- [ ] bind 'Enter' to open timecard comments
- [ ] 'speed mode' to fill out all comments without touching the mouse

## Privacy Policy
ADP Plus does not send or transmit any user data.
Any user data collected by the extension is stored in the user's browser and destroyed when the tab is closed.
