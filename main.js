// ThingSpeak Configuration
const CHANNEL_ID = "2943953";
const READ_API_KEY = "ET3NDE8LT9TVFMZ4";
const db = firebase.firestore();

// DateTime Update
function updateTime() {
  const now = new Date();
  document.getElementById("datetime").innerText = now.toLocaleString();
}
setInterval(updateTime, 1000);
updateTime();

// Dark Mode Toggle
const themeToggleBtn = document.getElementById('theme-toggle-btn');
themeToggleBtn.addEventListener('click', function() {
  document.documentElement.setAttribute('data-theme', 
    document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  
  // Update chart background based on theme
  updateChartTheme();
});

function updateChartTheme() {
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const liveChart = document.getElementById('live-chart');
  if (liveChart) {
    const currentSrc = liveChart.src;
    if (isDarkMode) {
      liveChart.src = currentSrc.replace('bgcolor=%23ffffff', 'bgcolor=%23333333');
    } else {
      liveChart.src = currentSrc.replace('bgcolor=%23333333', 'bgcolor=%23ffffff');
    }
  }
}

// Risk Alert Banner
function showRiskAlert(show, message = "Warning: High risk level detected!") {
  const alertBanner = document.getElementById('risk-alert-banner');
  const alertMessage = document.getElementById('alert-message');
  
  if (show) {
    alertBanner.classList.remove('hidden');
    alertMessage.textContent = message;
    // Speak warning if voice assistant enabled
    speakWarning(message);
  } else {
    alertBanner.classList.add('hidden');
  }
}

document.getElementById('alert-close').addEventListener('click', function() {
  document.getElementById('risk-alert-banner').classList.add('hidden');
});

// Voice Assistant
let speechSynthesis = window.speechSynthesis;
let isSpeechEnabled = false;

document.getElementById('voice-btn').addEventListener('click', function() {
  isSpeechEnabled = !isSpeechEnabled;
  this.classList.toggle('active');
  if (isSpeechEnabled) {
    speakWarning("Voice alerts are now enabled");
  }
});

function speakWarning(message) {
  if (isSpeechEnabled && speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(message);
    speechSynthesis.speak(utterance);
  }
}

// Get location for form
document.getElementById('get-location').addEventListener('click', function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      const locationField = document.getElementById('issue-location');
      locationField.value = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
    }, function() {
      alert("Unable to retrieve your location");
    });
  } else {
    alert("Geolocation is not supported by this browser");
  }
});

// Form submission (now using Firebase)
document.getElementById('query-form').addEventListener('submit', async function(event) {
  event.preventDefault();

  const issueType = document.getElementById('issue-type').value;
  const description = document.getElementById('issue-description').value;
  const location = document.getElementById('issue-location').value || "Not Provided";
  const timestamp = new Date();

  try {
    await db.collection("reports").add({
      type: issueType,
      description: description,
      location: location,
      timestamp: timestamp
    });

    alert("Issue reported successfully and saved to database!");
    this.reset();
  } catch (error) {
    console.error("Error saving report:", error);
    alert("Error saving report. Please try again.");
  }
});

// Simple Chatbot functionality
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-message');
const sendButton = document.getElementById('send-message');

const knowledgeBase = {
  'ppm': 'PPM stands for Parts Per Million, which measures gas concentration in the sewage system.',
  'safe': 'Gas levels under 100 PPM are generally considered safe. Anything above 200 PPM requires immediate attention.',
  'high risk': 'High risk levels indicate dangerous gas concentrations (>200 PPM) or rising sewage levels (<20 cm) that require immediate attention.',
  'moderate risk': 'Moderate risk levels indicate gas concentrations between 100-200 PPM or sewage levels between 20-50 cm that should be monitored.',
  'low risk': 'Low risk levels indicate safe operating conditions with gas concentrations below 100 PPM and sewage levels above 50 cm.',
  'absorbent': 'The absorbent material helps reduce odors and certain gases in the sewage system.',
  'distance': 'The distance sensor measures the sewage level in the system. Lower distances indicate higher sewage levels.',
  'default': 'I don\'t have information about that. Please ask about PPM, risk levels, or sensor readings.'
};

function addMessage(message, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
  messageDiv.textContent = message;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotResponse(userQuery) {
  userQuery = userQuery.toLowerCase();
  
  // Current sensor data context
  const ppm = document.getElementById('ppm').textContent;
  const distance = document.getElementById('distance').textContent;
  const risk = document.getElementById('risk').textContent;
  
  // Special cases for current readings
  if (userQuery.includes('current') || userQuery.includes('reading')) {
    return `Current readings: Gas level is ${ppm}, Distance is ${distance}, and Risk level is ${risk}.`;
  }
  
  if (userQuery.includes('is it safe') || userQuery.includes('safety')) {
    if (risk === 'Low') {
      return 'Current conditions are safe. All readings are within normal parameters.';
    } else if (risk === 'Moderate') {
      return 'Current conditions require monitoring. Consider checking the system.';
    } else if (risk === 'High') {
      return 'WARNING: Current conditions are NOT safe. Immediate attention required!';
    }
  }
  
  // Simple keyword matching
  for (const keyword in knowledgeBase) {
    if (userQuery.includes(keyword)) {
      return knowledgeBase[keyword];
    }
  }
  return knowledgeBase.default;
}

sendButton.addEventListener('click', function() {
  const userMessage = userInput.value.trim();
  if (userMessage) {
    addMessage(userMessage, true);
    
    // Get and display bot response
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage);
      addMessage(botResponse, false);
    }, 500);
    
    userInput.value = '';
  }
});

userInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendButton.click();
  }
});

// ThingSpeak data fetching functionality - integrated from your code
async function fetchSensorData() {
  const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1&api_key=${READ_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    const feed = data.feeds[0];
    
    const ppm = parseFloat(feed.field1);
    const distance = parseFloat(feed.field2);
    const absorbent = feed.field4 || "Pending";
    
    // Display PPM
    document.getElementById("ppm").innerText = absorbent + " PPM";
        
    // Display Distance
    document.getElementById("distance").innerText = !isNaN(distance) ? distance + " PPM" : "N/A";
    
    // Display Absorbent
    document.getElementById("absorbent").innerText = !isNaN(ppm) ? ppm + " cm" : "N/A";
    
    // Calculate and display Risk Level
    const riskEl = document.getElementById("risk");
    
    if (!isNaN(ppm) && !isNaN(distance)) {
      const risk = calculateRiskLevel(ppm, distance);
      riskEl.innerText = risk;
      
      // Color code
      if (risk === "High") {
        riskEl.style.color = "red";
        showRiskAlert(true, `Warning: High risk level detected! Gas: ${ppm} PPM, Level: ${distance} cm`);
      } else if (risk === "Moderate") {
        riskEl.style.color = "orange";
        showRiskAlert(false);
      } else {
        riskEl.style.color = "limegreen";
        showRiskAlert(false);
      }
    } else {
      riskEl.innerText = "Pending";
      riskEl.style.color = "white";
    }
    
    // Update live chart if needed
    updateLiveChart();
    
  } catch (error) {
    console.error("Error fetching data:", error);
    document.getElementById("ppm").innerText = "Error";
    document.getElementById("distance").innerText = "Error";
    document.getElementById("risk").innerText = "Error";
    document.getElementById("absorbent").innerText = "Error";
  }
}

function calculateRiskLevel(ppm, distance) {
  if (ppm > 200 || distance < 20) {
    return "High";
  } else if (ppm > 100 || distance < 50) {
    return "Moderate";
  } else {
    return "Low";
  }
}

// Update the ThingSpeak chart
function updateLiveChart() {
  const liveChart = document.getElementById('live-chart');
  if (liveChart) {
    const timestamp = new Date().getTime();
    const baseUrl = liveChart.src.split('?')[0];
    const params = new URLSearchParams(liveChart.src.split('?')[1]);
    
    // Add timestamp to refresh
    params.set('timestamp', timestamp);
    
    // Update theme if needed
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    params.set('bgcolor', isDarkMode ? '%23333333' : '%23ffffff');
    
    liveChart.src = `${baseUrl}?${params.toString()}`;
  }
}

// Initialize the live chart
function initLiveChart() {
  const liveChart = document.getElementById('live-chart');
  if (liveChart) {
    liveChart.src = `https://thingspeak.com/channels/${CHANNEL_ID}/charts/1?bgcolor=%23ffffff&color=%23d62020&dynamic=true&results=60&title=Sensor+Data&type=line&api_key=${READ_API_KEY}`;
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
  initLiveChart();
  fetchSensorData(); // Initial fetch
});

// Fetch data every 5 seconds
setInterval(fetchSensorData, 5000);
