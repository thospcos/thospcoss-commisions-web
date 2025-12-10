// IMPORTANT: For security, NEVER expose webhook URLs in client-side code
// In production, use a serverless function or backend API
const webhookURL = "https://discord.com/api/webhooks/1444318939751518369/-9blXMbgbRx-r-Frr6OgENLAhgB_H3Vg6LV37u6qejKaFRcjSKOgqd5l5TYaHM_QQzGr"; // Replace with actual endpoint

// Rate limiting implementation
class RateLimiter {
    constructor(limit, interval) {
        this.limit = limit; // Number of allowed attempts
        this.interval = interval; // Time in milliseconds
        this.attempts = [];
    }

    canProceed() {
        const now = Date.now();
        // Remove old attempts
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

// Initialize rate limiter (5 attempts per 10 minutes)
const rateLimiter = new RateLimiter(5, 10 * 60 * 1000);

// Escape JSON for safe transmission
function escapeJSON(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

// Get current timestamp in readable format
function getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

// Validate form data
function validateFormData(name, email, message) {
    const errors = [];
    
    if (!name || name.trim().length < 2) {
        errors.push("Name must be at least 2 characters long");
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Please enter a valid email address");
    }
    
    if (!message || message.trim().length < 10) {
        errors.push("Message must be at least 10 characters long");
    }
    
    if (message && message.trim().length > 2000) {
        errors.push("Message must be less than 2000 characters");
    }
    
    return errors;
}

// Handle form submission
document.getElementById("contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = document.getElementById("submitBtn");
    const originalText = submitBtn.textContent;
    
    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();
    const category = document.getElementById("category").value;
    const honeypot = document.getElementById("website").value;
    
    // Check honeypot (if filled, it's likely a bot)
    if (honeypot) {
        console.log("Bot detected via honeypot");
        // Reset form but don't send
        form.reset();
        submitBtn.textContent = "MESSAGE SENT";
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
        return;
    }
    
    // Validate form data
    const errors = validateFormData(name, email, message);
    if (errors.length > 0) {
        alert("Please fix the following errors:\n\n" + errors.join("\n"));
        return;
    }
    
    // Check rate limiting
    if (!rateLimiter.canProceed()) {
        const waitTime = rateLimiter.getTimeToWait();
        alert(`Too many attempts. Please wait ${waitTime} seconds before trying again.`);
        return;
    }
    
    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = "SENDING...";
    submitBtn.classList.add("loading");
    
    try {
        // Prepare data for Discord
        const timestamp = getCurrentTimestamp();
        const discordMessage = {
            embeds: [{
                title: "📨 New Contact Form Submission",
                color: 0x2cff6a,
                fields: [
                    { name: "Name", value: escapeJSON(name) || "Not provided", inline: true },
                    { name: "Email", value: escapeJSON(email) || "Not provided", inline: true },
                    { name: "Category", value: escapeJSON(category) || "General", inline: true },
                    { name: "Message", value: escapeJSON(message).substring(0, 1000) + (message.length > 1000 ? "..." : ""), inline: false },
                    { name: "Timestamp", value: timestamp, inline: false }
                ],
                footer: { text: "thOSp Contact Form" }
            }]
        };
        
        // Send to Discord webhook
        const response = await fetch(webhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(discordMessage)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        // Success
        submitBtn.textContent = "✓ MESSAGE SENT";
        submitBtn.style.borderColor = "#00ff00";
        submitBtn.style.color = "#00ff00";
        
        // Reset form
        form.reset();
        
        // Show success message
        alert("Thank you! Your message has been sent successfully.\nWe'll get back to you soon.");
        
    } catch (error) {
        console.error("Form submission error:", error);
        
        // Show error state
        submitBtn.textContent = "✗ SEND FAILED";
        submitBtn.style.borderColor = "#ff4444";
        submitBtn.style.color = "#ff4444";
        
        alert("Sorry, there was an error sending your message. Please try again later.");
        
    } finally {
        // Reset button after delay
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
            submitBtn.style.borderColor = "";
            submitBtn.style.color = "";
        }, 3000);
    }
});

// Add input validation feedback
document.querySelectorAll('#contactForm input, #contactForm textarea').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.style.borderColor = '#ff4444';
        } else {
            this.style.borderColor = '';
        }
    });
    
    input.addEventListener('input', function() {
        this.style.borderColor = '';
    });
});

// Initialize form state
console.log("thOSp contact form initialized");
