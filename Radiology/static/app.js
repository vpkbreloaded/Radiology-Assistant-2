const templateEl = document.getElementById("template");
const historyEl = document.getElementById("history");
const findingsEl = document.getElementById("findings");
const reportEl = document.getElementById("report");

document.getElementById("aiBtn").addEventListener("click", async () => {
  reportEl.value = "Generating...";
  const resp = await fetch("/api/ai/suggest", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      template: templateEl.value,
      clinical_history: historyEl.value,
      findings: findingsEl.value
    })
  });
  const data = await resp.json();
  reportEl.value = data.report || data.error || "Unknown error";
});

const micBtn = document.getElementById("micBtn");
const micStatus = document.getElementById("micStatus");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let recording = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalText += event.results[i][0].transcript + " ";
      }
    }
    if (finalText) findingsEl.value += finalText;
  };

  recognition.onstart = () => micStatus.textContent = "Listening...";
  recognition.onend = () => {
    micStatus.textContent = "";
    recording = false;
    micBtn.textContent = "Start dictation";
  };

  micBtn.addEventListener("click", () => {
    if (!recording) {
      recognition.start(); // starts dictation [web:15]
      recording = true;
      micBtn.textContent = "Stop dictation";
    } else {
      recognition.stop(); // stops dictation [web:15]
    }
  });
} else {
  micBtn.disabled = true;
  micStatus.textContent = "SpeechRecognition not supported in this browser.";
}
