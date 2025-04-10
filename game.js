document.addEventListener("DOMContentLoaded", () => {
  let data = [];
  let currentAircraft;
  let lastAircraft;
  let difficulty;
  let score = 0;
  let total = 0;
  let highScore = localStorage.getItem("planeguessrHighScore") || 0;
  let usedAircraft = [];

  document.getElementById("high-score").innerText = highScore;

  fetch("aircraft-data.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      document.querySelector('button[onclick="startGame()"]').disabled = false;
    })
    .catch(error => console.error("Error loading JSON:", error));

  window.startGame = function () {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    difficulty = document.getElementById("difficulty-select").value;
    score = 0;
    total = 0;
    usedAircraft = [];
    updateScore();
    nextRound();
  };

  function nextRound() {
    document.getElementById("feedback").innerText = "";

    if (usedAircraft.length === data.length) {
      document.getElementById("feedback").innerText = "You’ve seen all aircraft! More will be added soon. GG";
      return;
    }

    do {
      currentAircraft = data[Math.floor(Math.random() * data.length)];
    } while (
      currentAircraft === lastAircraft ||
      usedAircraft.includes(currentAircraft.model)
    );

    lastAircraft = currentAircraft;
    usedAircraft.push(currentAircraft.model);

    const imageUrl = `${currentAircraft.image}?t=${Date.now()}`;
    const oldImg = document.getElementById("aircraft-img");
    const newImg = oldImg.cloneNode();
    newImg.src = imageUrl;
    newImg.alt = "Aircraft";
    newImg.id = "aircraft-img";
    newImg.className = oldImg.className.replace("loaded", "");
    newImg.onload = () => {
      newImg.classList.add("loaded");
    };
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
    shuffleArray(answers);
    answers = answers.slice(0, 3);
    answers.push(correctAnswer);
    shuffleArray(answers);
    return answers;
  }

  function displayChoices(answers, correctAnswer) {
    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = "";
    answers.forEach(choice => {
      const btn = document.createElement("button");
      btn.innerText = choice;
      btn.className = "px-4 py-2 border rounded hover:bg-[#eaeaea] hover:text-[#121212] transition font-medium";
      btn.onclick = () => checkAnswer(choice, correctAnswer);
      choicesDiv.appendChild(btn);
    });
  }

  function checkAnswer(choice, correctAnswer) {
    total++;
    const feedback = document.getElementById("feedback");
    if (choice === correctAnswer) {
      feedback.innerText = "✅ Correct!";
      score++;
      updateScore();
      setTimeout(nextRound, 700);
    } else {
      feedback.innerText = `❌ Wrong! It's ${correctAnswer}`;
      updateScore();
      setTimeout(nextRound, 2000);
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
  };

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
});