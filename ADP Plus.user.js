// ==UserScript==
// @name        ADP Plus
// @description A Chrome Extension that adds AutoFill, AutoSave & other features to ADP TimeClock for CBU Student Workers
// @namespace   ADP
// @include     https://eetd2.adp.com/*
// @grant       none
// @version     1.0
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

	inPunchTime = document.getElementById("widgetFrame2402").contentWindow.document.querySelector(`#column-inPunch-Row-${row_number} > div`).innerText;
	outPunchTime = document.getElementById("widgetFrame2402").contentWindow.document.querySelector(`#column-outPunch-Row-${row_number} > div`).innerText;

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

	const calculatedHours = calculateHours(inPunchTime, outPunchTime);
	return `${fix}${inPunchTime} - ${outPunchTime}, ${calculatedHours} hours, `; // comment format
}

function getPunchTimeFromUser(inOrOut) {
  const userInput = window.prompt(`Please enter a Punch ${inOrOut} time (e.g. 10:00PM):`);
  if (userInput !== null) {
		return userInput;
  } else {
    alert("Operation canceled by the user.");
  }
}

function calculateHours(punchIn, punchOut) {
	punchIn = convertTo24(punchIn)[0];
	punchOut = convertTo24(punchOut);
	const start = new Date("2000-01-01 " + punchIn);
	let   end   = new Date("2000-01-01 " + punchOut[0]);
	if (punchOut[1] === 1) { end = new Date("2000-01-02 " + punchOut[0]); }
	const timeDifference = (end - start);
	const hoursWorked = timeDifference / (1000 * 60 * 60);
	return roundUpToNearestQuarter(hoursWorked);
}

function roundUpToNearestQuarter(number) {
	return Math.ceil(number / 0.25) * 0.25;
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
  autoSave(SAVE_INTERVAL);
  autoClickComment();
});
