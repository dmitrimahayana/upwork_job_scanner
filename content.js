function extractJobDetail(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html'); // Parse the HTML string

  const jobDetailElement = doc.querySelectorAll("div[data-test='about-client-container']");
  console.log('📄 about-client elements:', jobDetailElement.length);


  if(jobDetailElement.length > 0) {
    const clientJobPostedElement = doc.querySelectorAll("div[data-test='about-client-container'] li[data-qa='client-job-posting-stats'] strong");
    const clientHireRateElement = doc.querySelectorAll("div[data-test='about-client-container'] li[data-qa='client-job-posting-stats'] div");
    const clientAvgHourlyRateElement = doc.querySelectorAll("div[data-test='about-client-container'] strong[data-qa='client-hourly-rate']");
    const clientBudgetElement = doc.querySelectorAll("div[data-test='BudgetAmount']");
    const hireRateMatch = clientHireRateElement[0] && clientHireRateElement[0].innerText.match(/(\d+)%/);
    const hireRate = hireRateMatch ? parseInt(hireRateMatch[1]) : null;
    console.log('📊 Client Hire Rate:', hireRate);
    const jobsPosted = clientJobPostedElement[0] ?  parseInt(clientJobPostedElement[0].innerText.replace(/[^\d]/g, ''), 10) : 0;
    console.log('📊 Client Jobs Posted:', jobsPosted);
    const avgHourlyRateText = (clientAvgHourlyRateElement[0] && clientAvgHourlyRateElement[0].innerText.match(/\$?(\d+\.?\d*)/) || [])[1];
    console.log('📊 Client Average Hourly Rate:', avgHourlyRateText);
    const warningList = document.createElement('ul');
    warningList.setAttribute('data-warning-list', 'true');
    warningList.style.paddingLeft = '20px';

    const qualificationsElement = doc.querySelectorAll("ul.qualification-items span.icons");
    let qualifications = 0;
    qualificationsElement.forEach((element) => {
      if(element.innerHTML.includes('You do not meet this qualification')){
        const warning = document.createElement('li');
        qualifications++;
        let existingWarning = Array.from(warningList.children).find(
          li => li.textContent.endsWith('qualification(s) not met.')
        );
        if (existingWarning) {
          existingWarning.textContent = qualifications + ' qualification(s) not met.';
        } else {
          warning.textContent = qualifications + ' qualification(s) not met.';
          warning.style.color = 'red';
          warning.style.fontWeight = 'bold';
          warning.style.marginBottom = '10px';
          warning.style.listStyleType = 'auto';
          warningList.appendChild(warning);
        }
      }
    });
    
    const clientActivitiesElement = doc.querySelectorAll("section[data-test='ClientActivity'] ul.client-activity-items li");
    
    clientActivitiesElement.forEach(activity => {
      const activityText = activity.innerText;
      if (activityText.includes("20 to 50") || activityText.includes("50+")) {
        const warning = document.createElement('li');
        warning.textContent = 'Too many proposals have been submitted.';
        warning.style.color = 'red';
        warning.style.fontWeight = 'bold';
        warning.style.marginBottom = '10px';
        warning.style.listStyleType = 'auto';
        warningList.appendChild(warning);
      } else if(activityText.includes("Hires")) {
        const freelancersToHireElement = doc.querySelectorAll("div[data-test='FreelancersToHire']");
        const freelancersToHire = freelancersToHireElement[0] ? parseInt(freelancersToHireElement[0].innerText.replace(/[^\d]/g, ''), 10) : 0;
        const hired = parseInt(activityText.replace(/[^\d]/g, ''), 10) || 0;
        
        if(freelancersToHire <= hired){
          const warning = document.createElement('li');
          warning.textContent = 'Job filled.';
          warning.style.color = 'red';
          warning.style.fontWeight = 'bold';
          warning.style.marginBottom = '10px';
          warning.style.listStyleType = 'auto';
          warningList.appendChild(warning);
        }
      }
    });

    if (hireRate !== null && (
      (jobsPosted <= 20 && hireRate < 50) ||
      (jobsPosted > 20 && jobsPosted <= 100 && hireRate < 60) ||
      (jobsPosted > 100 && hireRate < 65)
    )) {
      const warning = document.createElement('li');
      warning.textContent = 'Client hire rate is too low.';
      warning.style.color = 'red';
      warning.style.fontWeight = 'bold';
      warning.style.marginBottom = '10px';
      warning.style.listStyleType = 'auto';
      warningList.appendChild(warning);
    }

    const postedOnElement = doc.querySelectorAll("div[data-test='PostedOn']");
    
    const hasNotFreshWarning = Array.from(warningList.children).some(
      li => li.textContent === 'Outdated job.'
    );
    
    if(!hasNotFreshWarning && postedOnElement[0]) {
      if (!postedOnElement[0].innerText.includes("minutes ago") && !postedOnElement[0].innerText.includes("minute ago")){
        if(postedOnElement[0].innerText.includes("hours ago") || postedOnElement[0].innerText.includes("hour ago")) {
          const postedOn = parseInt(postedOnElement[0].innerText.replace(/[^\d]/g, ''), 10) || 0;
    
          if (postedOn > 4) {
            const warning = document.createElement('li');
            warning.textContent = 'Outdated job.';
            warning.style.color = 'orange';
            warning.style.fontWeight = 'bold';
            warning.style.marginBottom = '10px';
            warning.style.listStyleType = 'auto';
            warningList.appendChild(warning);
          }
        } else {
          const warning = document.createElement('li');
          warning.textContent = 'Outdated job.';
          warning.style.color = 'orange';
          warning.style.fontWeight = 'bold';
          warning.style.marginBottom = '10px';
          warning.style.listStyleType = 'auto';
          warningList.appendChild(warning);
        }
      }
    }

    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    if (isWeekend) {
      const weekendWarning = document.createElement('li');
      weekendWarning.textContent = 'Today is weekend (Saturday or Sunday).';
      weekendWarning.style.color = 'orange';
      weekendWarning.style.fontWeight = 'bold';
      weekendWarning.style.marginBottom = '10px';
      weekendWarning.style.listStyleType = 'auto';
      warningList.appendChild(weekendWarning);
    }

    if(warningList.children.length === 0) {
      const warning = document.createElement('li');
      warning.textContent = 'Highly recommended to apply.';
      warning.style.color = 'green';
      warning.style.fontWeight = 'bold';
      warning.style.marginBottom = '10px';
      warning.style.marginLeft = '-20px';
      warningList.appendChild(warning);
    }

    const minBudget = parseInt((clientBudgetElement[0] && clientBudgetElement[0].innerText.match(/\$?(\d+\.?\d*)/) || [])[1]);
    const maxBudget = parseInt((clientBudgetElement[1] && clientBudgetElement[1].innerText.match(/\$?(\d+\.?\d*)/) || [])[1]);
    
    let avgHourlyRate = parseFloat(avgHourlyRateText);
    
    if(avgHourlyRate && clientBudgetElement.length > 1 && (minBudget <= avgHourlyRate && maxBudget >= avgHourlyRate)) {
      const avgRateItem = document.createElement('li');
      avgRateItem.style.marginLeft = '-20px';
      avgRateItem.textContent = 'Client Avg. Hourly Rate: $' + avgHourlyRate + '/hr';
      warningList.appendChild(avgRateItem)
      const suggestedRate = document.createElement('li');
      suggestedRate.style.marginLeft = '-20px';
      suggestedRate.textContent = 'Suggested Hourly Rate: $' + ((avgHourlyRate-2) < minBudget ? minBudget : avgHourlyRate-2) + ' - $' + ((avgHourlyRate+2) > maxBudget ? maxBudget : (avgHourlyRate+2)) + ' /hr';
      warningList.appendChild(suggestedRate)
    }

    if (!warningList.querySelector('li') || document.body.contains(document.querySelector('ul[data-warning-list="true"]'))) {
      return;
    }

    const targetDiv = document.querySelector('div.job-details-content');
    if (targetDiv) {
      targetDiv.prepend(warningList);
    } else {
      document.body.prepend(warningList);
    }
  }
}

function FilterRating(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html'); // Parse the HTML string

  const clientRatingElements = doc.querySelectorAll("div.air3-rating-value-text");
  for ( let i = 0; i < clientRatingElements.length; i++) {
    const text = clientRatingElements[i].innerText;
    if (parseFloat(text) < 4.5) {
      const elements = document.querySelectorAll('article');
      const info = document.createElement('div');
      info.textContent = 'Removing job with a client rating of ' + text + '.';
      info.style.color = 'red';
      info.style.fontWeight = 'bold';
      info.style.marginBottom = '10px';
      elements[i].prepend(info);
      setTimeout(() => {
        elements[i].style.opacity = '1';
          elements[i].style.transition = 'opacity 0.5s';
          elements[i].style.opacity = '0';
          setTimeout(() => {
            elements[i].style.display = 'none';
          }, 1000);
      }, 2000); // Initial delay before any animation
    }
  }
    
}

// Automatically run generateData when the page has fully loaded
window.addEventListener('load', generateData);

const navButton = document.querySelectorAll("li.air3-pagination-item");
const pageNumber = document.querySelectorAll("li.air3-pagination-nr");
console.log('✅ Extension loaded');
console.log('📄 pageNumber elements:', pageNumber.length);
console.log('🔘 navButton elements:', navButton.length);

navButton.forEach(button => {
  button.addEventListener('click', () => {
    setTimeout(() => {
      generateData();
    }, 3000);
  });
});

pageNumber.forEach(button => {
  button.addEventListener('click', () => {
    setTimeout(() => {
      generateData();
    }, 3000);
  });
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Wait for element with specific text to appear
function waitForElement(selector, textContent, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      const elements = document.querySelectorAll(selector);
      const found = Array.from(elements).find(el =>
        el.textContent.trim().includes(textContent)
      );

      if (found) {
        console.log(`✅ Found element: ${selector} with text "${textContent}"`);
        resolve(found);
      } else if (Date.now() - startTime > timeout) {
        console.warn(`⏱️ Timeout waiting for: ${selector} with text "${textContent}"`);
        reject(new Error('Element not found within timeout'));
      } else {
        setTimeout(checkElement, 100); // Check every 100ms
      }
    };

    checkElement();
  });
}

// Click listener for air3-link
document.addEventListener('click', async (e) => {
  if (e.target.closest('.air3-link')) {
    console.log('🔗 air3-link clicked');

    try {
      // Wait for "About the client" h5 to load
      await waitForElement('h5', 'About the client');

      const divJobDetails = document.querySelector("div.air3-slider-body");
      if (divJobDetails && divJobDetails.outerHTML) {
        extractJobDetail(divJobDetails.outerHTML);
      }
    } catch (error) {
      console.error('❌ Failed to load job details:', error);
    }
  }
});

async function generateData() {
  const div = document.getElementById("main");
  if (div && div.outerHTML) {
    FilterRating(div.outerHTML);
  }
}

// Auto-refresh state
let autoRefreshEnabled = localStorage.getItem('autoRefreshEnabled') !== 'false'; // Default true
let refreshTimeout = null;
let challengeActive = false;

const BASE_MIN_MS = 3 * 60 * 1000;   // 3 minutes
const BASE_MAX_MS = 6 * 60 * 1000;   // 6 minutes
const MAX_INTERVAL_MS = 15 * 60 * 1000; // backoff cap
const HOUR_MS = 60 * 60 * 1000;

// Check if current page is a Cloudflare challenge (full-page interstitial only;
// Cloudflare also injects challenge-platform scripts on normal Upwork pages)
function isCloudflareChallenge() {
  if (document.getElementById('main')) return false; // real Upwork content loaded
  if (/just a moment|attention required/i.test(document.title)) return true;
  return document.querySelector(
    "#challenge-form, #challenge-running, #challenge-stage, #cf-challenge-running"
  ) !== null;
}

// Backoff state: number of recent challenges, decays by 1 per clean hour
function getChallengeCount() {
  let count = parseInt(localStorage.getItem('cfChallengeCount'), 10) || 0;
  let last = parseInt(localStorage.getItem('cfLastChallenge'), 10) || 0;
  const hours = Math.floor((Date.now() - last) / HOUR_MS);

  if (count > 0 && hours > 0) {
    count = Math.max(0, count - hours);
    last += hours * HOUR_MS;
    localStorage.setItem('cfChallengeCount', count);
    localStorage.setItem('cfLastChallenge', last);
  }
  return count;
}

function recordChallenge() {
  const count = getChallengeCount() + 1;
  localStorage.setItem('cfChallengeCount', count);
  localStorage.setItem('cfLastChallenge', Date.now());
  console.warn(`🛑 Cloudflare challenge detected (#${count}), backing off`);
}

// Get random interval: 3-6 minutes, doubled per recent challenge, capped at 15
function getRandomInterval() {
  const base = BASE_MIN_MS + Math.random() * (BASE_MAX_MS - BASE_MIN_MS);
  const backoff = Math.pow(2, getChallengeCount());
  return Math.round(Math.min(base * backoff, MAX_INTERVAL_MS));
}

// Short beep to get attention (may be blocked by autoplay policy)
function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.warn('🔇 Alert sound blocked:', error);
  }
}

// Pause refresh and alert until challenge is gone
function handleChallenge() {
  challengeActive = true;
  stopAutoRefresh();
  recordChallenge();
  updateToggleButton();
  playAlertSound();

  const poll = setInterval(() => {
    if (isCloudflareChallenge()) {
      if (!document.title.startsWith('🔴')) {
        document.title = '🔴 ' + document.title;
      }
      return;
    }

    clearInterval(poll);
    challengeActive = false;
    document.title = document.title.replace(/^🔴 /, '');
    console.log('✅ Cloudflare challenge cleared, resuming');
    updateToggleButton();
    if (autoRefreshEnabled) {
      startAutoRefresh();
    }
  }, 2000);
}

// Toggle auto-refresh on/off
function toggleAutoRefresh() {
  autoRefreshEnabled = !autoRefreshEnabled;
  localStorage.setItem('autoRefreshEnabled', autoRefreshEnabled);

  if (autoRefreshEnabled) {
    startAutoRefresh();
    console.log('✅ Auto-refresh enabled');
  } else {
    stopAutoRefresh();
    console.log('⛔ Auto-refresh disabled');
  }

  updateToggleButton();
}

// Check if job detail panel (About the client) is open on current page
function isAboutClientOpen() {
  return document.querySelector("[data-test='about-client-container'], div.fe-job-details") !== null;
}

// Start auto-refresh
function startAutoRefresh() {
  if (refreshTimeout || challengeActive) return; // Already running or waiting on challenge

  const interval = getRandomInterval();
  const minutes = (interval / 60000).toFixed(1);
  console.log(`⏰ Next refresh in ${minutes} minutes`);

  refreshTimeout = setTimeout(() => {
    refreshTimeout = null;
    if (!autoRefreshEnabled) return;

    // Check page first: skip refresh while about-client panel is shown
    if (isAboutClientOpen()) {
      console.log('⏸️ Job details open (about-client-container or fe-job-details), refresh skipped');
      startAutoRefresh();
      return;
    }

    console.log('🔄 No job details open, auto-refreshing page...');
    window.location.reload();
  }, interval);
}

// Stop auto-refresh
function stopAutoRefresh() {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
}

// Create toggle button UI
function createToggleButton() {
  const button = document.createElement('button');
  button.id = 'auto-refresh-toggle';
  button.style.position = 'fixed';
  button.style.top = '500px';
  button.style.right = '20px';
  button.style.zIndex = '10000';
  button.style.padding = '10px 15px';
  button.style.borderRadius = '5px';
  button.style.border = '2px solid #333';
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';
  button.style.fontSize = '14px';

  button.addEventListener('click', toggleAutoRefresh);
  document.body.appendChild(button);
  updateToggleButton();
}

// Update button appearance
function updateToggleButton() {
  const button = document.getElementById('auto-refresh-toggle');
  if (!button) return;

  if (challengeActive) {
    button.textContent = '⚠️ Solve captcha';
    button.style.backgroundColor = '#FF9800';
    button.style.color = 'white';
    return;
  }

  button.textContent = autoRefreshEnabled ? '🔄 Auto-Refresh: ON' : '⏸️ Auto-Refresh: OFF';
  button.style.backgroundColor = autoRefreshEnabled ? '#4CAF50' : '#f44336';
  button.style.color = 'white';
}

// Initialize on page load
function initAutoRefresh() {
  if (document.getElementById('auto-refresh-toggle')) return; // Already initialized
  createToggleButton();

  if (isCloudflareChallenge()) {
    handleChallenge();
    return;
  }

  if (autoRefreshEnabled) {
    startAutoRefresh();
  }
}

if (document.readyState === 'complete') {
  initAutoRefresh();
} else {
  window.addEventListener('load', initAutoRefresh);
}
