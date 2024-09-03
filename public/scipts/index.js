import { AnimalType } from "./simulation/animals.js";
import { SimulationWrapper } from "./simulation/simulation.js";

const canvas = document.getElementById("canvas");

const simWrapper = new SimulationWrapper(canvas);
simWrapper.toggleInteractions(true);

let previousData = {
  animalType: AnimalType.FISH,
  amount: 150,
  style: {
    fill: "random",
    finFill: "inherit",
    outline: "#04080a",
    outlineWidth: 1.5,
    eyesColor: "#04080a",
  },
};

let style = {
  ...previousData.style,
};

//////////////////

const bodyColorInput = document.getElementById("body-color");
const randomButton = document.getElementById("body-color-random");

bodyColorInput.addEventListener("input", function () {
  style.fill = bodyColorInput.value;
  randomButton.disabled = false;
});
randomButton.addEventListener("click", function () {
  style.fill = "random";
  randomButton.disabled = true;
});

///////////////////

const finColorInput = document.getElementById("fin-color");
const inheritButton = document.getElementById("fin-color-inherit");

finColorInput.addEventListener("input", function () {
  style.finFill = finColorInput.value;
  inheritButton.disabled = false;
});
inheritButton.addEventListener("click", function () {
  style.finFill = "inherit";
  inheritButton.disabled = true;
});

///////////////////

let selectedAnimal = AnimalType.FISH;

const animalRadios = document.querySelectorAll('input[name="animal"]');
animalRadios.forEach((radio) => {
  radio.addEventListener("change", handleAnimalChange);
});

const finDiv = document.getElementById("fin-option");
const animalMap = {
  fish: AnimalType.FISH,
  lizard: AnimalType.LIZARD,
};
function handleAnimalChange(event) {
  selectedAnimal = animalMap[event.target.value];
  if (selectedAnimal === AnimalType.FISH) {
    finDiv.classList.remove("hidden");
  } else {
    finDiv.classList.add("hidden");
  }
}

///////////////////

const outlineColorInput = document.getElementById("outline-color");
outlineColorInput.addEventListener("input", function () {
  style.outline = outlineColorInput.value;
});

const eyeColorInput = document.getElementById("eye-color");
eyeColorInput.addEventListener("input", function () {
  style.eyesColor = eyeColorInput.value;
});

///////////////////////////

let amount = 150;
const rangeInput = document.getElementById("amount");
const rangeLabel = document.getElementById("amount-label");
rangeLabel.textContent = rangeInput.value;

rangeInput.addEventListener("input", function () {
  rangeLabel.textContent = rangeInput.value;
  amount = parseInt(rangeInput.value);
});

//////////////////////////

function updateSimulationSettings() {
  let styleCopy = { ...style };
  if (styleCopy.finFill === "inherit") {
    delete styleCopy.finFill;
  }

  if (selectedAnimal !== previousData.animalType) {
    simWrapper.replaceAnimalType(selectedAnimal);
    simWrapper.setBasicStyle(styleCopy, "#29c6ff");
  } else if (amount != previousData.amount) {
    simWrapper.changeCreaturesAmount(amount);
    simWrapper.setBasicStyle(styleCopy, "#29c6ff");
  } else {
    simWrapper.setBasicStyle(styleCopy, "#29c6ff");
  }
  previousData.amount = amount;
  previousData.animalType = selectedAnimal;
  previousData.style = { ...style };
}

document.getElementById("confirm").addEventListener("click", function () {
  document.getElementById("settings").open = false;
  updateSimulationSettings();
});

setTimeout(() => {
  updateSimulationSettings();
  console.log(style);
});
