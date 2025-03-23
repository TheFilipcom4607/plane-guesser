let data = [];
let currentAircraft;

fetch("aircraft-data.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    newRound();
  });

function newRound() {
  document.getElementById("feedback").innerText = "";
  const difficulty = document.getElementById("difficulty").value;
  currentAircraft = data[Math.floor(Math.random() * data.length)];
  document.getElementById("aircraft-img").src = currentAircraft.image;

  let correctAnswer;
  if (difficulty === "easy") correctAnswer = currentAircraft.manufacturer;
  else if (difficulty === "normal") correctAnswer = currentAircraft.family;
  else correctAnswer = currentAircraft.model;

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
  const feedback = document.getElementById("feedback");
  if (choice === correctAnswer) {
    feedback.innerText = "✅ Correct!";
  } else {
    feedback.innerText = `❌ Wrong! Correct answer: ${correctAnswer}`;
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
