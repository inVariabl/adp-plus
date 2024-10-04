// ==UserScript==
// @name        ADP Plus
// @description A Chrome Extension that adds AutoFill, AutoSave & other features to ADP TimeClock for CBU Student Workers
// @namespace   ADP
// @include     https://eetd2.adp.com/*
// @include     https://*.mykronos.com/*
// @grant       none
// @version     2.0
// @author      Daniel Crooks
// @icon        https://raw.githubusercontent.com/inVariabl/adp-plus/main/extension/icon.png
// @license     GPL-3
// @downloadURL https://github.com/inVariabl/adp-plus/raw/main/ADP%20Plus.user.js
// @updateURL 	https://github.com/inVariabl/adp-plus/raw/main/ADP%20Plus.user.js
// ==/UserScript==

const SAVE_INTERVAL = 10; // AutoSaves every 10 seconds
const ADHP_MODE = false;

function getRowInfo(row_number) {
	let inPunchTime = "";
	let outPunchTime = "";
	let fix = "";
	let punchDate = "";

	inPunchTime = document.getElementById("widgetFrame2402").contentWindow.document.querySelector(`#column-inPunch-Row-${row_number} > div`).innerText;
	outPunchTime = document.getElementById("widgetFrame2402").contentWindow.document.querySelector(`#column-outPunch-Row-${row_number} > div`).innerText;
	punchDate = document.getElementById("widgetFrame2402").contentWindow.document.querySelector(`#column-Date-Row-${row_number} > div`).innerText;

	punchDate = simplifyDate(punchDate);

	if (inPunchTime == "") {
 		inPunchTime = getPunchTimeFromUser("In");
 		fix = "FIX: ";
 	}

 	if (outPunchTime == "") {
 		outPunchTime = getPunchTimeFromUser("Out");
 		fix = "FIX: ";
 	}

	if (ADHP_MODE) {
		fix = "FIX: ";
	}

	//inPunchTime = roundToNearestHalfHour(inPunchTime);
	//outPunchTime = roundToNearestHalfHour(outPunchTime);

	const calculatedHours = calculateHours(inPunchTime, outPunchTime);

	// TODO: Make Picker to Select RD

	// Jeremy Duket Format:
	// [FIX: Start - End, Total Hours, Description]
	// e.g. [FIX: 2:00 - 5:00pm, 3 hrs, staff meeting]
	//return `${fix}${inPunchTime} - ${outPunchTime}, ${calculatedHours} hours, `; // Jeremy Duket comment format

	// Austin Iannuzzi Format:
	// [Date; Total Hours; Time Frame; Description]
	// e.g. [8/6; 3 hrs; 2-5pm; staff meeting]
	return `${punchDate}; ${calculatedHours} hrs; ${inPunchTime} - ${outPunchTime}; `;
}

function getPunchTimeFromUser(inOrOut) {
  const userInput = window.prompt(`Please enter a Punch ${inOrOut} time (e.g. 10:00PM):`);
  if (userInput !== null) {
		return userInput;
  } else {
    alert("Operation canceled by the user.");
  }
}

function roundToNearestHalfHour(timeStr) {
    // Parse the time string
    let [time, period] = timeStr.split(/(?=[APM])/);
    let [hours, minutes] = time.split(':').map(Number);

    // Convert to 24-hour format for easier manipulation
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    // Round minutes to the nearest half hour
    if (minutes < 15) {
        minutes = 0;
    } else if (minutes >= 15 && minutes < 45) {
        minutes = 30;
    } else {
        minutes = 0;
        hours += 1;
    }

    // Adjust hours if it overflows
    if (hours === 24) {
        hours = 0;
    }

    // Convert back to 12-hour format
    period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) {
        hours = 12;
    }

    // Format minutes to always be two digits
    minutes = minutes.toString().padStart(2, '0');

    // Return the rounded time string
    return `${hours}:${minutes}${period}`;
}

function calculateHours(punchIn, punchOut) {
	punchIn = convertTo24(punchIn)[0];
	punchOut = convertTo24(punchOut);
	const start = new Date("2000-01-01 " + punchIn);
	let   end   = new Date("2000-01-01 " + punchOut[0]);
	if (punchOut[1] === 1) { end = new Date("2000-01-02 " + punchOut[0]); }
	const timeDifference = (end - start);
	const hoursWorked = timeDifference / (1000 * 60 * 60);
	// return roundUpToNearestQuarter(hoursWorked); // CA Law No Longer Rounds
	return roundUpToThreeDecimals(hoursWorked);
}

function roundUpToThreeDecimals(number) {
	return Math.ceil(number * 1000) / 1000;
}

function convertTo24(time12) {
  const [time, period] = time12.match(/^(\d+:\d+)([APap][Mm])$/).slice(1);
  let [hours, minutes] = time.split(":");
  let day = 0;
  hours = parseInt(hours);

  if (period === "PM" && hours !== 12) { hours += 12; }
  else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  if (hours < 5) { // before 5:00AM = new day
    day = 1;
  }

  return [`${hours.toString()}:${minutes}`, day];
}

function simplifyDate(dateString) {
	const datePart = dateString.split(' ')[1];
	const [month, day] = datePart.split('/').map(part => part.replace(/^0+/, ''));
	return `${month}/${day}`;
}

function autofillComment(row_number) {
  document.getElementById("widgetFrame2402").contentWindow.document.querySelector("#comments_0_kcomment_0_knote_txtarea_editNote").value = getRowInfo(row_number);
}

function enterKeyPressOKButton() {
  document.getElementById("widgetFrame2402").contentWindow.document.addEventListener("keydown", function(event) {
    if (event.key === "Return" || event.key === "Enter") {
      document.getElementById("widgetFrame2402").contentWindow.document.querySelector("#addComment > footer > div > a.btn.btn-ok.krn-hard-destroy-monitor-control.ng-binding").click();
  	}
  });
	saveTimeCard(); // Save timecard after saving comment
}

function escapeKeyPressCloseButton() {
  document.getElementById("widgetFrame2402").contentWindow.document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
      document.getElementById("widgetFrame2402").contentWindow.document.querySelector("#comment-add-dialog > div.jqx-window-header.jqx-window-header-bluefin.jqx-widget-header.jqx-widget-header-bluefin.jqx-disableselect.jqx-disableselect-bluefin.jqx-rc-t.jqx-rc-t-bluefin > div.jqx-window-close-button-background.jqx-window-close-button-background-bluefin > div").click();
  	}
  });
	saveTimeCard(); // Save timecard after saving comment
}

function maximizeTimeCard() {
  document.querySelector("body > krn-app > krn-navigator-container > ui-view > krn-workspace-manager-container > krn-workspace > div > krn-layout-manager > div > div.krn-layout-manager__slot.resizable.no-transition.col75.h100.hide-grabber.order1 > krn-widget > krn-toolbar > h5 > div > button:nth-child(1)").click();
}

function getSelectedRowNumber() {
  const row_id = document.getElementById("widgetFrame2402").contentWindow.document.querySelector("div.jqx-fill-state-pressed-bluefin").children[0].id;
  const regex = /\d+/;
  const match = row_id.match(regex);

  if (match) {
    return parseInt(match[0]);
  } else {
    console.error("No number found in the string.");
  }
}

function fill() {
  const row_number = getSelectedRowNumber();
  autofillComment(row_number);
  //const row = getRowInfo(row_number);
  //console.log({row});
}

const fullscreenObserver = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.addedNodes) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement && node.matches("button.krn-toolbar__button")) {
          maximizeTimeCard();
          observer.disconnect();
          return;
        }
      }
    }
  }
});

// TODO: These callback functions should be abstracted and standardized to avoid callback hell

function waitForPageLoad(callback) {
  const intervalId = setInterval(() => {
    const element = document.getElementById("widgetFrame2402");
    if (element) {
      try {
        const iframeDocument = element.contentWindow.document;
        const innerText = iframeDocument.querySelector("#columntablejqxGrid0 > div:nth-child(3) > div > div:nth-child(1) > div").innerText;

        if (innerText == "Date") {
          clearInterval(intervalId); // Stop checking
          callback(); // Execute the provided callback function
        }
      } catch(e) {
        // Page Didn't Load
      }
    }
  }, 5000);
}


function waitForElementText(selector, value, callback) {
  const intervalId = setInterval(() => {
    const element = document.getElementById("widgetFrame2402");
    if (element) {
      try {
        const iframeDocument = element.contentWindow.document;
        const innerText = iframeDocument.querySelector(selector).innerText == value;
      	  if (innerText) {
        	clearInterval(intervalId);
        	callback();
      	  }
      } catch(e) {
        // Element Text Not Available
      }
    }
  }, 500);
}

function waitForElementToBeVisible(selector, callback, continuous) {
  const intervalId = setInterval(() => {
    const element = document.getElementById("widgetFrame2402");
    if (element) {
      try {
        const iframeDocument = element.contentWindow.document;
        const visible = iframeDocument.querySelector(selector).checkVisibility();
        if (visible) {
          if (continuous) {
            clearInterval(intervalId); // Stop checking
          }
          callback(); // Execute the provided callback function
        }
      } catch(e) {
        // Element Not Visible
      }
    }
  }, 500);
}

function waitForElementToBeEnabled(selector, callback, continuous) {
  const intervalId = setInterval(() => {
    const element = document.getElementById("widgetFrame2402");
    if (element) {
      try {
        const iframeDocument = element.contentWindow.document;
        const disabled = iframeDocument.querySelector(selector).disabled;
        if (!disabled) {
          if (continuous) {
            clearInterval(intervalId); // Stop checking
		  }
          callback(); // Execute the provided callback function
        }
      } catch(e) {
        // Element Disabled
      }
    }
  }, 500);
}

function autoSave(seconds) {
  const intervalId = setInterval(() => {
		saveTimeCard();
  }, (seconds * 1000)); // Check every x seconds
}

function saveTimeCard() {
	const element = document.getElementById("widgetFrame2402");
	if (element) {
		const iframeDocument = element.contentWindow.document;
    const saved = iframeDocument.querySelector("#saveButton_btn").classList.contains("disabled");
		if (!saved) {
			document.getElementById("widgetFrame2402").contentWindow.document.querySelector("#saveButton_btn > i").click();
			console.log("TimeCard Saved.");
		}
	}
}

function autoClickComment() {
waitForElementToBeVisible("#commentButton\\.workedshift", () => {
  document.getElementById("widgetFrame2402").contentWindow.document.querySelector("#commentButton\\.workedshift").click(); // Comment

	waitForElementText("#comments_lbl_commentsSize", 'Comments (0)', () => {
  	document.getElementById("widgetFrame2402").contentWindow.document.querySelector("#comments_kcombo_addCommentsList_toggleBtn").click(); // DropDown

		waitForElementToBeVisible("#comments_kcombo_addCommentsList_li9", () => {
			document.getElementById("widgetFrame2402").contentWindow.document.querySelector("#comments_kcombo_addCommentsList_li9").click(); // Other

			waitForElementToBeEnabled("#comments_0_kcomment_0_knote_txtarea_editNote", () => {
				fill();
				document.getElementById("widgetFrame2402").contentWindow.document.querySelector("#comments_0_kcomment_0_knote_txtarea_editNote").isContentEditable = true;
			}, true)
		}, false)
	});
}, false)
}

fullscreenObserver.observe(document.body, { childList: true, subtree: true });

waitForPageLoad(() => {
  console.log("Page Fully Loaded!");
  enterKeyPressOKButton();
  escapeKeyPressCloseButton();
  autoSave(SAVE_INTERVAL);
  autoClickComment();
});
