// === CONFIG ===
const WEBHOOK_URL = "https://discord.com/api/webhooks/1448550152158838936/avMJGylaWKWS2YuHmTp2gfLFUerf-9P_pAb6qSo78wb8LA9eHFLB5U6YqaRGNOh6TqxV";

// === PRICE LIST ===
const prices = {
  "Keychain": 13000,
  "Pin": 13000,
  "Acrylic Standee": 21000
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("orderForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get all fields
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const type = document.getElementById("type").value;
    const amount = parseInt(document.getElementById("amount").value);
    const message = document.getElementById("message").value.trim();

    // Validation
    if (!email.includes("@")) {
      alert("Please enter a valid email.");
      return;
    }
    if (message.length < 10) {
      alert("Message must be at least 10 characters.");
      return;
    }
    if (!type) {
      alert("Please select an accessory type.");
      return;
    }
    if (amount < 1 || amount > 10) {
      alert("Amount must be between 1 and 10.");
      return;
    }

    // Price calculation
    const finalPrice = prices[type] * amount;

    // Build Discord embed
    const payload = {
      username: "Order Notifier",
      embeds: [
        {
          title: "New Order Received!",
          color: 0x2cff6a,
          fields: [
            { name: "Name", value: name },
            { name: "Email", value: email },
            { name: "Accessory Type", value: type },
            { name: "Amount", value: String(amount) },
            { name: "Price Paid", value: finalPrice.toLocaleString() + " IDR" },
            { name: "Message", value: message }
          ],
          footer: { text: "thosp • Commisions" }
        }
      ]
    };

    // Send to Discord
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert( Order Sent Successfully!");
        form.reset();
      } else {
        alert("Failed to send order.");
      }
    } catch (err) {
      alert("Error sending order.");
      console.error(err);
    }
  });
});
