
document.addEventListener("DOMContentLoaded", () => {
const welcomeMessage = document.getElementById("welcomeMessage");
  const messages = {
    morning: [
      "Good morning. Ready to start? 🌅",
      "Let's get ahead of the day. 🕗",
      "Good day to catch up."
    ],
    afternoon: [
      "Let's keep the momentum going.",
      "Time to finish some work. 💼",
      "Keep going. Keep growing. 🌱"
    ],
    evening: [
      "Last push for the day. 🌟",
      "Almost there.",
      "Let's wrap things up. 🌌"
    ]
  };
   let messages;

      if (hour < 12) messages = morning;
      else if (hour < 17) messages = afternoon;
      else messages = evening;

      const random = Math.floor(Math.random() * messages.length);

      document.getElementById("welcomeMessage").textContent = messages[random];
  let currentIndex = 0;

function updateWelcome() {
    welcomeMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    welcomeMessage.style.opacity = "1";
    const hour = new Date().getHours();
    let messages;

    if (hour < 12) messages = messageData.morning;
    else if (hour < 17) messages = messageData.afternoon;
    else messages = messageData.evening;

    if (welcome) {
      welcome.textContent = messages[currentIndex % messages.length];
      welcome.style.opacity = "1";
    }
    currentIndex++;
}
  

updateWelcome();
setInterval(updateWelcome, 60000);
