const webhookURL =
  "https://discord.com/api/webhooks/1444318939751518369/-9blXMbgbRx-r-Frr6OgENLAhgB_H3Vg6LV37u6qejKaFRcjSKOgqd5l5TYaHM_QQzGr";

document.getElementById("contactForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const message = document.getElementById("message").value;

  fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content:
        "# New thOSp Form Submission\n" +
        `**Name:** ${name}\n` +
        `**Message:** ${message}`
    })
  })
  .then(() => {
    alert("Message sent, thank you for your cooperation!");
    e.target.reset();
  })
  .catch(() => alert("Failed to send ❌"));
});
