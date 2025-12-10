// Discord Webhook URL
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1444318939751518369/-9blXMbgbRx-r-Frr6OgENLAhgB_H3Vg6LV37u6qejKaFRcjSKOgqd5l5TYaHM_QQzGr";

// Store IP address
let userIP = '';

// Rate Limiter
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

const rateLimiter = new RateLimiter(3, 5 * 60 * 1000);

// DOM Elements
const form = document.getElementById('contactForm');
const statusMessage = document.getElementById('statusMessage');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const charCounter = document.getElementById('charCounter');
const messageInput = document.getElementById('message');

// Fetch IP Address (not displayed, just collected)
function fetchIPAddress() {
    fetch("https://api.ipify.org/?format=json")
        .then(response => response.json())
        .then(data => {
            userIP = data.ip;
            console.log("IP collected:", data.ip);
        })
        .catch(error => {
            console.error("Error fetching IP:", error);
            userIP = 'Not available';
        });
}

// Show Status Message
function showStatus(text, type = 'info') {
    statusMessage.textContent = text;
    statusMessage.className = `status-message ${type}`;
}

// Hide Status Message
function hideStatus() {
    statusMessage.style.display = 'none';
}

// Clear Form Errors
function clearErrors() {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

// Validate Form
function validateForm(name, email, message) {
    clearErrors();
    const errors = [];
    
    if (!name || name.trim().length < 2) {
        errors.push("Name must be at least 2 characters");
        document.getElementById('name').classList.add('error');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push("Please enter a valid email");
        document.getElementById('email').classList.add('error');
    }
    
    if (!message || message.trim().length < 10) {
        errors.push("Message must be at least 10 characters");
        document.getElementById('message').classList.add('error');
    } else if (message.length > 2000) {
        errors.push("Message must be less than 2000 characters");
        document.getElementById('message').classList.add('error');
    }
    
    return errors;
}

// Format Discord Message with IP
function formatDiscordMessage(name, email, category, message) {
    const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return {
        content: "**New Contact Form Submission**",
        embeds: [{
            title: "Contact Request",
            color: 0x2cff6a,
            fields: [
                {
                    name: "Contact Info",
                    value: `**Name:** ${name}\n**Email:** ${email}\n**Category:** ${category || 'Not specified'}`,
                    inline: false
                },
                {
                    name: "Message",
                    value: message.length > 1000 ? message.substring(0, 1000) + '...' : message,
                    inline: false
                },
                {
                    name: "IP Address",
                    value: userIP || 'Not available',
                    inline: false
                },
                {
                    name: "Time",
                    value: timestamp,
                    inline: false
                }
            ]
        }]
    };
}

// Handle Form Submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const category = document.getElementById('category').value;
    const honeypot = document.getElementById('website').value;
    
    if (honeypot) {
        showStatus('Message sent.', 'success');
        form.reset();
        charCounter.textContent = '0/2000';
        return;
    }
    
    const errors = validateForm(name, email, message);
    if (errors.length > 0) {
        showStatus(errors.join('\n'), 'error');
        return;
    }
    
    if (!rateLimiter.canProceed()) {
        const waitTime = rateLimiter.getTimeToWait();
        showStatus(`Wait ${waitTime} seconds before trying again.`, 'error');
        return;
    }
    
    submitBtn.disabled = true;
    btnText.textContent = 'SENDING';
    btnSpinner.style.display = 'inline-block';
    showStatus('Sending...', 'info');
    
    try {
        const discordMessage = formatDiscordMessage(name, email, category, message);
        
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(discordMessage)
        });
        
        if (!response.ok) {
            throw new Error(`Failed: ${response.status}`);
        }
        
        showStatus('Message sent successfully.', 'success');
        form.reset();
        charCounter.textContent = '0/2000';
        
        setTimeout(() => {
            btnText.textContent = 'SEND MESSAGE';
            btnSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        showStatus('Failed to send. Try again.', 'error');
        
        btnText.textContent = 'TRY AGAIN';
        btnSpinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    fetchIPAddress();
    
    messageInput.addEventListener('input', () => {
        const length = messageInput.value.length;
        charCounter.textContent = `${length}/2000`;
        
        if (length > 1900) {
            charCounter.className = 'char-counter error';
        } else if (length > 1500) {
            charCounter.className = 'char-counter warning';
        } else {
            charCounter.className = 'char-counter';
        }
    });
    
    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
            hideStatus();
        });
    });
    
    form.addEventListener('submit', handleSubmit);
    document.getElementById('name').focus();
});
