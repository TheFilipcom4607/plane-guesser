document.addEventListener("DOMContentLoaded", () => {
  let data = [];
  let currentAircraft;
  let lastAircraft;
  let difficulty;
  let mode;
  let score = 0;
  let total = 0;
  let highScore = localStorage.getItem("planeguessrHighScore") || 0;
  let usedAircraft = [];
  let recentFamilies = [];
  const MAX_RECENT_FAMILIES = 5;
  let timerInterval;
  let timeLeft = 60;
  let gameOver = false;

  const modeSelect = document.getElementById("mode-select");
  const timeWrapper = document.getElementById("time-wrapper");

  modeSelect.addEventListener("change", () => {
    timeWrapper.style.display = modeSelect.value === "timed" ? "block" : "none";
  });

  if (modeSelect.value !== "timed") {
    timeWrapper.style.display = "none";
  }

  document.getElementById("high-score").innerText = highScore;

  fetch("aircraft-data.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      document.querySelector('button[onclick="startGame()"]')?.removeAttribute("disabled");
    })
    .catch(error => console.error("Error loading JSON:", error));

  window.startGame = function () {
    document.getElementById("start-screen").style.display = "none";
    const gameScreen = document.getElementById("game-screen");
    gameScreen.style.display = "block";
    gameScreen.classList.remove("screen-fade");
    void gameScreen.offsetWidth;
    gameScreen.classList.add("screen-fade");

    difficulty = document.getElementById("difficulty-select").value;
    mode = document.getElementById("mode-select").value;
    score = 0;
    total = 0;
    usedAircraft = [];
    recentFamilies = [];
    gameOver = false;
    updateScore();

    if (mode === "timed") {
      const selectedTime = parseInt(document.getElementById("time-select")?.value || "60", 10);
      timeLeft = selectedTime;
      const totalTime = selectedTime;
      document.getElementById("timer").innerText = `${timeLeft}s`;
      document.getElementById("timer").style.color = "";
      document.getElementById("timer-container").style.display = "";
      document.getElementById("timer-bar-wrapper").style.display = "block";
      document.getElementById("timer-bar").style.width = "100%";
      document.getElementById("timer-bar").style.backgroundColor = "";
      timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").innerText = `${timeLeft}s`;
        const pct = (timeLeft / totalTime) * 100;
        document.getElementById("timer-bar").style.width = `${pct}%`;
        if (timeLeft <= 10) {
          document.getElementById("timer").style.color = "#e94560";
          document.getElementById("timer-bar").style.backgroundColor = "#e94560";
        }
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          endTimedGame();
        }
      }, 1000);
    } else {
      document.getElementById("timer-container").style.display = "none";
      document.getElementById("timer-bar-wrapper").style.display = "none";
    }

    nextRound();
  };

  function endTimedGame() {
    gameOver = true;
    const feedback = document.getElementById("feedback");
    feedback.innerText = `Time's up! Final score: ${score}`;
    feedback.classList.add("text-3xl");
    document.querySelectorAll(".choice-btn").forEach(btn => btn.disabled = true);
  }

  function nextRound() {
    if (gameOver) return;

    const feedback = document.getElementById("feedback");
    feedback.innerText = "";
    feedback.classList.remove("text-3xl");

    if (usedAircraft.length === data.length) {
      document.getElementById("feedback").innerText = "You've seen all aircraft! More will be added soon. GG";
      return;
    }

    let attempts = 0;
    do {
      currentAircraft = data[Math.floor(Math.random() * data.length)];
      attempts++;
      if (attempts > 100) break;
    } while (
      currentAircraft === lastAircraft ||
      usedAircraft.includes(currentAircraft.model) ||
      recentFamilies.includes(currentAircraft.family)
    );

    lastAircraft = currentAircraft;
    usedAircraft.push(currentAircraft.model);

    recentFamilies.push(currentAircraft.family);
    if (recentFamilies.length > MAX_RECENT_FAMILIES) recentFamilies.shift();

    const imageUrl = `${currentAircraft.image}?t=${Date.now()}`;
    const oldImg = document.getElementById("aircraft-img");
    const newImg = oldImg.cloneNode();
    newImg.src = imageUrl;
    newImg.alt = "Aircraft";
    newImg.id = "aircraft-img";
    newImg.className = oldImg.className.replace("loaded", "");
    newImg.onload = () => newImg.classList.add("loaded");
    oldImg.replaceWith(newImg);

    const correctAnswer = getCorrectAnswer();
    const answers = generateAnswers(correctAnswer);
    displayChoices(answers, correctAnswer);
  }

  function getCorrectAnswer() {
    if (difficulty === "easy") return currentAircraft.manufacturer;
    if (difficulty === "normal") return currentAircraft.family;
    return currentAircraft.model;
  }

  function generateAnswers(correctAnswer) {
    let answers = data.map(ac => {
      if (difficulty === "easy") return ac.manufacturer;
      if (difficulty === "normal") return ac.family;
      return ac.model;
    });
    answers = [...new Set(answers.filter(a => a !== correctAnswer))];

    if (difficulty === "easy") {
      answers = ["Airbus", "Boeing"];
    } else {
      shuffleArray(answers);
      answers = answers.slice(0, 3);
      answers.push(correctAnswer);
      shuffleArray(answers);
    }
    return answers;
  }

  function displayChoices(answers, correctAnswer) {
    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = "";
    answers.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.innerHTML = `<span style="opacity:0.4;margin-right:6px;font-size:0.8em;">${i + 1}</span>${choice}`;
      btn.className = "choice-btn";
      btn.disabled = false;
      btn.onclick = () => {
        document.querySelectorAll(".choice-btn").forEach(b => b.disabled = true);
        checkAnswer(choice, correctAnswer, btn);
      };
      choicesDiv.appendChild(btn);
    });
  }

  function checkAnswer(choice, correctAnswer, clickedBtn) {
    total++;
    const feedback = document.getElementById("feedback");
    const buttons = document.querySelectorAll(".choice-btn");

    buttons.forEach(btn => {
      if (btn.textContent.slice(1) === correctAnswer || btn.textContent.slice(2) === correctAnswer) {
        btn.style.borderColor = "#4ade80";
        btn.style.boxShadow = "0 0 0 2px rgba(74, 222, 128, 0.3)";
      } else if (btn === clickedBtn) {
        btn.style.borderColor = "#f87171";
        btn.style.boxShadow = "0 0 0 2px rgba(248, 113, 113, 0.3)";
      }
    });

    if (choice === correctAnswer) {
      feedback.innerHTML = '<span style="color:#4ade80;">&#10003; Correct!</span>';
      score++;
      const scoreEl = document.getElementById("score");
      scoreEl.classList.remove("score-pop");
      void scoreEl.offsetWidth;
      scoreEl.classList.add("score-pop");
      updateScore();
      setTimeout(() => nextRound(), mode === "timed" ? 300 : 700);
    } else {
      feedback.innerHTML = `<span style="color:#f87171;">&#10007; Wrong!</span> <span style="color:#888;margin-left:4px;">The answer was</span> <span style="color:#eaeaea;font-weight:700;">${correctAnswer}</span>`;
      updateScore();
      setTimeout(() => nextRound(), mode === "timed" ? 500 : 2000);
    }
  }

  function updateScore() {
    document.getElementById("score").innerText = score;
    document.getElementById("total").innerText = total;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("planeguessrHighScore", highScore);
      document.getElementById("high-score").innerText = highScore;
    }
  }

  window.resetGame = function () {
    document.getElementById("game-screen").style.display = "none";
    const startScreen = document.getElementById("start-screen");
    startScreen.style.display = "block";
    startScreen.classList.remove("screen-fade");
    void startScreen.offsetWidth;
    startScreen.classList.add("screen-fade");
    clearInterval(timerInterval);
    gameOver = false;
  };

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  document.addEventListener("keydown", (e) => {
    const key = e.key;
    const buttons = Array.from(document.querySelectorAll(".choice-btn"));
    if (["1", "2", "3", "4"].includes(key)) {
      const index = parseInt(key) - 1;
      if (index < buttons.length && !buttons[index].disabled) {
        const btn = buttons[index];
        // Visual press feedback
        btn.style.background = "#eaeaea";
        btn.style.color = "#121212";
        btn.style.transform = "translateY(-3px)";
        btn.style.boxShadow = "0 4px 12px rgba(234, 234, 234, 0.2)";
        btn.click();
      }
    }
  });
});
