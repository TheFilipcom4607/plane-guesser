// === UPDATED game.js with Timed Mode ===
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
    document.getElementById("game-screen").style.display = "block";
    difficulty = document.getElementById("difficulty-select").value;
    mode = document.getElementById("mode-select").value;
    score = 0;
    total = 0;
    usedAircraft = [];
    recentFamilies = [];
    gameOver = false;
    updateScore();

    if (mode === "timed") {
      timeLeft = 60;
      document.getElementById("timer").innerText = `⏱️ Time Left: ${timeLeft}s`;
      document.getElementById("timer").style.display = "block";
      timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").innerText = `⏱️ Time Left: ${timeLeft}s`;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          endTimedGame();
        }
      }, 1000);
    } else {
      document.getElementById("timer").style.display = "none";
    }

    nextRound();
  };

  function endTimedGame() {
    gameOver = true;
    const feedback = document.getElementById("feedback");
    feedback.innerText = `⏹️ Time's up! Final score: ${score}`;
    feedback.classList.add("text-3xl", "font-bold");
    document.querySelectorAll(".choice-btn").forEach(btn => btn.disabled = true);
  }

  function nextRound() {
    if (gameOver) return;

    const feedback = document.getElementById("feedback");
    feedback.innerText = "";
    feedback.classList.remove("text-3xl", "font-bold");

    if (usedAircraft.length === data.length) {
      document.getElementById("feedback").innerText = "You’ve seen all aircraft! More will be added soon. GG";
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
      // Always return Airbus then Boeing (or reversed if needed)
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
    answers.forEach(choice => {
      const btn = document.createElement("button");
      btn.innerText = choice;
      btn.className = "choice-btn px-4 py-2 border rounded hover:bg-[#eaeaea] hover:text-[#121212] transition font-medium";
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
      if (btn.innerText === correctAnswer) {
        btn.classList.add("border-green-500", "ring", "ring-green-400");
      } else if (btn === clickedBtn) {
        btn.classList.add("border-red-500", "ring", "ring-red-400");
      }
    });

    if (choice === correctAnswer) {
      feedback.innerText = "✅ Correct!";
      score++;
      updateScore();
      setTimeout(() => {
        nextRound();
      }, mode === "timed" ? 300 : 700);
    } else {
      feedback.innerText = `❌ Wrong! It's ${correctAnswer}`;
      updateScore();
      setTimeout(() => {
        nextRound();
      }, mode === "timed" ? 500 : 2000);
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
    document.getElementById("start-screen").style.display = "block";
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
        buttons[index].click();
      }
    }
  });
});
