// Replace with your Replit backend URL (no trailing slash)
const BACKEND =
  "https://2a4abcd6-40d2-4637-bfbf-109e414448ac-00-ktfdc7vlgx2h.sisko.replit.dev";

const getQBtn = document.getElementById("getQ");
const questionDiv = document.getElementById("question");
const choicesDiv = document.getElementById("choices");
const resultDiv = document.getElementById("result");
const explainBtn = document.getElementById("explainBtn");
const explainArea = document.getElementById("explainArea");
let currentId = null;

getQBtn.onclick = async () => {
  resultDiv.textContent = "";
  explainArea.textContent = "";
  explainBtn.style.display = "none";
  choicesDiv.innerHTML = "Loading...";
  try {
    const res = await fetch(BACKEND + "/api/question");
    const j = await res.json();
    currentId = j.id;
    questionDiv.textContent = j.q;
    choicesDiv.innerHTML = "";
    j.choices.forEach((c, i) => {
      const b = document.createElement("button");
      b.textContent = c;
      b.onclick = async () => {
        resultDiv.textContent = "Checking...";
        const r = await fetch(BACKEND + "/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentId, choice: i }),
        });
        const jr = await r.json();
        resultDiv.textContent = jr.correct ? "Correct 🎉" : "Wrong ❌";
        explainBtn.style.display = "inline-block";
      };
      choicesDiv.appendChild(b);
    });
  } catch (err) {
    choicesDiv.innerHTML = "";
    resultDiv.textContent = "Error fetching question. Is backend running?";
    console.error(err);
  }
};

explainBtn.onclick = async () => {
  if (!currentId) return;
  explainArea.textContent = "Loading explanation...";
  try {
    const r = await fetch(BACKEND + "/api/explain/" + currentId);
    const jr = await r.json();
    explainArea.textContent =
      jr.explanation + "\n\n(source: " + (jr.source || "cached") + ")";
  } catch (err) {
    explainArea.textContent = "Error loading explanation.";
    console.error(err);
  }
};
