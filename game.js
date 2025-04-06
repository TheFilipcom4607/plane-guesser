let data = [];
let currentAircraft;
let difficulty;
let score = 0;
let total = 0;

// Load aircraft data first
fetch("aircraft-data.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    document.querySelector('button[onclick="startGame()"]').disabled = false;
  });

// Initialize the game
function startGame() {
  difficulty = document.getElementById("difficulty-select").value;
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  score = 0;
  total = 0;
  updateScore();
  nextRound();
}

function nextRound() {
  document.getElementById("feedback").innerText = "";
  currentAircraft = data[Math.floor(Math.random() * data.length)];

  // ✅ Use exact image path from JSON
  document.getElementById("aircraft-img").src = currentAircraft.image;

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
  } else {
    feedback.innerText = `❌ Wrong! It's ${correctAnswer}`;
  }
  updateScore();
}

function updateScore() {
  document.getElementById("score").innerText = score;
  document.getElementById("total").innerText = total;
}

function resetGame() {
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("start-screen").style.display = "block";
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
