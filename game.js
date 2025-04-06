document.addEventListener("DOMContentLoaded", () => {
  let data = [];
  let currentAircraft;
  let lastAircraft;
  let difficulty;
  let score = 0;
  let total = 0;

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
    updateScore();
    nextRound();
  };

  function nextRound() {
    document.getElementById("feedback").innerText = "";

    // Pick a different aircraft than last round
    do {
      currentAircraft = data[Math.floor(Math.random() * data.length)];
    } while (currentAircraft === lastAircraft);
    lastAircraft = currentAircraft;

    // Set image with cache-busting timestamp
    const imageUrl = `${currentAircraft.image}?t=${Date.now()}`;
    document.getElementById("aircraft-img").src = imageUrl;

    console.log("Next Aircraft:", currentAircraft.model, "| Image:", imageUrl);

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
    console.log("Clicked:", choice, "| Correct:", correctAnswer);
    total++;
    const feedback = document.getElementById("feedback");
    if (choice === correctAnswer) {
      feedback.innerText = "✅ Correct!";
      score++;
      updateScore();
      setTimeout(() => {
        console.log("→ Next round (correct)");
        nextRound();
      }, 700);
    } else {
      feedback.innerText = `❌ Wrong! It's ${correctAnswer}`;
      updateScore();
      setTimeout(() => {
        console.log("→ Next round (wrong)");
        nextRound();
      }, 2000);
    }
  }

  function updateScore() {
    document.getElementById("score").innerText = score;
    document.getElementById("total").innerText = total;
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
