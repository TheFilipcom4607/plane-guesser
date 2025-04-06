function nextRound() {
  document.getElementById("feedback").innerText = "";
  currentAircraft = data[Math.floor(Math.random() * data.length)];
  document.getElementById("aircraft-img").src = currentAircraft.image.replace(".png", ".jpg");

  const correctAnswer = getCorrectAnswer();
  const answers = generateAnswers(correctAnswer);

  displayChoices(answers, correctAnswer);
}
