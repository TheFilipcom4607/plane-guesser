document.addEventListener("DOMContentLoaded", () => {
  let data = [];
  let activeData = [];
  let currentAircraft;
  let lastAircraft;
  let difficulty;
  let mode;
  let score = 0;
  let total = 0;
  let highScore = 0;
  let usedAircraft = [];
  let recentFamilies = [];
  const MAX_RECENT_FAMILIES = 5;
  let timerInterval;
  let timeLeft = 60;
  let gameOver = false;

  // Streak & multiplier
  let streak = 0;
  let sessionBestStreak = 0;
  let multiplier = 1;
  let correctCount = 0;

  // Lifetime stats
  let lifeStats = JSON.parse(localStorage.getItem("planeguessrLifeStats")) || {
    gamesPlayed: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    bestStreak: 0
  };

  // Widebody/narrowbody classification by family
  const widebodyFamilies = new Set([
    "A300", "A310", "A330", "A340", "A350", "A380",
    "747", "767", "777", "787"
  ]);

  const modeSelect = document.getElementById("mode-select");
  const timeWrapper = document.getElementById("time-wrapper");
  const difficultySelect = document.getElementById("difficulty-select");
  const filterWrapper = document.getElementById("filter-wrapper");
  const filterSelect = document.getElementById("filter-select");

  modeSelect.addEventListener("change", () => {
    timeWrapper.style.display = modeSelect.value === "timed" ? "block" : "none";
  });

  difficultySelect.addEventListener("change", () => {
    if (difficultySelect.value === "easy") {
      filterWrapper.style.display = "none";
      filterSelect.value = "all";
    } else {
      filterWrapper.style.display = "";
    }
  });

  if (modeSelect.value !== "timed") {
    timeWrapper.style.display = "none";
  }
  if (difficultySelect.value === "easy") {
    filterWrapper.style.display = "none";
  }

  renderLifeStats();

  fetch("aircraft-data.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      document.querySelector('button[onclick="startGame()"]')?.removeAttribute("disabled");
    })
    .catch(error => console.error("Error loading JSON:", error));

  // --- Multiplier tiers ---
  function getMultiplier(s) {
    if (s >= 10) return 4;
    if (s >= 6) return 3;
    if (s >= 3) return 2;
    return 1;
  }

  // --- Streak & multiplier UI ---
  function updateStreak() {
    const streakContainer = document.getElementById("streak-container");
    const streakEl = document.getElementById("streak");
    if (streak >= 2) {
      streakContainer.style.display = "";
      streakEl.innerText = "\u{1F525} " + streak;
    } else {
      streakContainer.style.display = "none";
    }

    multiplier = getMultiplier(streak);
    const multContainer = document.getElementById("multiplier-container");
    const multEl = document.getElementById("multiplier");
    if (multiplier > 1 && mode === "timed") {
      multContainer.style.display = "";
      multEl.innerText = "\u00D7" + multiplier;
    } else {
      multContainer.style.display = "none";
    }
  }

  // --- Lifetime stats ---
  function renderLifeStats() {
    document.getElementById("stat-games").innerText = lifeStats.gamesPlayed;
    document.getElementById("stat-streak").innerText = lifeStats.bestStreak;
    if (lifeStats.totalAnswered > 0) {
      const pct = Math.round((lifeStats.totalCorrect / lifeStats.totalAnswered) * 100);
      document.getElementById("stat-accuracy").innerText = pct + "%";
    } else {
      document.getElementById("stat-accuracy").innerText = "\u2014";
    }
  }

  function saveLifeStats() {
    lifeStats.gamesPlayed++;
    lifeStats.totalCorrect += correctCount;
    lifeStats.totalAnswered += total;
    if (sessionBestStreak > lifeStats.bestStreak) {
      lifeStats.bestStreak = sessionBestStreak;
    }
    localStorage.setItem("planeguessrLifeStats", JSON.stringify(lifeStats));
    renderLifeStats();
  }

  // --- Game start ---
  window.startGame = function () {
    document.getElementById("start-screen").style.display = "none";
    const gameScreen = document.getElementById("game-screen");
    gameScreen.style.display = "block";
    gameScreen.classList.remove("screen-fade");
    void gameScreen.offsetWidth;
    gameScreen.classList.add("screen-fade");

    difficulty = document.getElementById("difficulty-select").value;
    mode = document.getElementById("mode-select").value;

    // Apply filter
    const filter = document.getElementById("filter-select").value;
    if (filter === "all" || difficulty === "easy") {
      activeData = data;
    } else if (filter === "widebody") {
      activeData = data.filter(ac => widebodyFamilies.has(ac.family));
    } else if (filter === "narrowbody") {
      activeData = data.filter(ac => !widebodyFamilies.has(ac.family));
    } else {
      activeData = data.filter(ac => ac.manufacturer === filter);
    }

    // Load mode-specific high score
    const hsKey = mode === "timed" ? "planeguessrHighScoreTimed" : "planeguessrHighScore";
    highScore = parseInt(localStorage.getItem(hsKey)) || 0;
    document.getElementById("high-score").innerText = highScore;

    score = 0;
    total = 0;
    correctCount = 0;
    streak = 0;
    sessionBestStreak = 0;
    multiplier = 1;
    usedAircraft = [];
    recentFamilies = [];
    gameOver = false;
    updateScore();
    updateStreak();

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
    saveLifeStats();
    const feedback = document.getElementById("feedback");
    feedback.innerText = `Time's up! ${correctCount}/${total} correct — ${score} pts`;
    feedback.classList.add("text-3xl");
    document.querySelectorAll(".choice-btn").forEach(btn => btn.disabled = true);
  }

  function nextRound() {
    if (gameOver) return;

    const feedback = document.getElementById("feedback");
    feedback.innerText = "";
    feedback.classList.remove("text-3xl");

    if (usedAircraft.length === activeData.length) {
      document.getElementById("feedback").innerText = "You've seen all aircraft! More will be added soon. GG";
      return;
    }

    let attempts = 0;
    do {
      currentAircraft = activeData[Math.floor(Math.random() * activeData.length)];
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
    let answers = activeData.map(ac => {
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
      btn.dataset.answer = choice;
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
      if (btn.dataset.answer === correctAnswer) {
        btn.classList.add("correct");
      }
      if (btn === clickedBtn && choice !== correctAnswer) {
        btn.classList.add("wrong");
      }
    });

    if (choice === correctAnswer) {
      correctCount++;
      streak++;
      if (streak > sessionBestStreak) sessionBestStreak = streak;
      updateStreak();

      const points = (mode === "timed") ? multiplier : 1;
      score += points;

      if (points > 1) {
        feedback.innerHTML = `<span style="color:#4ade80;">&#10003; Correct!</span> <span style="color:#eab308;">+${points}</span>`;
      } else {
        feedback.innerHTML = '<span style="color:#4ade80;">&#10003; Correct!</span>';
      }

      const countEl = document.getElementById("correct-count");
      countEl.classList.remove("score-pop");
      void countEl.offsetWidth;
      countEl.classList.add("score-pop");
      if (mode === "timed") {
        const scoreEl = document.getElementById("score");
        scoreEl.classList.remove("score-pop");
        void scoreEl.offsetWidth;
        scoreEl.classList.add("score-pop");
      }
      updateScore();
      setTimeout(() => nextRound(), mode === "timed" ? 400 : 1000);
    } else {
      streak = 0;
      updateStreak();
      feedback.innerHTML = `<span style="color:#f87171;">&#10007; Wrong!</span> <span style="color:#888;margin-left:4px;">The answer was</span> <span style="color:#eaeaea;font-weight:700;">${correctAnswer}</span>`;
      updateScore();
      setTimeout(() => nextRound(), mode === "timed" ? 600 : 2500);
    }
  }

  function updateScore() {
    document.getElementById("correct-count").innerText = correctCount;
    document.getElementById("total").innerText = total;
    document.getElementById("score").innerText = score;

    // Show points separately in timed mode
    document.getElementById("points-container").style.display = (mode === "timed") ? "" : "none";

    if (score > highScore) {
      highScore = score;
      const hsKey = mode === "timed" ? "planeguessrHighScoreTimed" : "planeguessrHighScore";
      localStorage.setItem(hsKey, highScore);
      document.getElementById("high-score").innerText = highScore;
    }
  }

  window.resetGame = function () {
    if (total > 0 && !gameOver) {
      saveLifeStats();
    }
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
        btn.classList.add("pressed");
        btn.click();
      }
    }
  });
});
