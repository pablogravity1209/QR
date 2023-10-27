const recordBtn = document.querySelector(".record");
const result = document.querySelector(".result");
const downloadBtn = document.querySelector(".download");
const inputLanguage = document.querySelector("#language");
const clearBtn = document.querySelector(".clear");


let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new SpeechRecognition(); // Crear una única instancia
recognition.continuous = true; // Permitir reconocimiento continuo

let recording = false;
let finalTranscript = ""; // Almacenar los resultados finales

function populateLanguages() {
  languages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang.code;
    option.innerHTML = lang.name;
    inputLanguage.appendChild(option);
  });
}

populateLanguages();

function isMathExpression(text) {
  // Expresión regular para detectar una expresión matemática en inglés o español
  const mathRegex = /^\s*[\d+\-*/^√()]+\s*$/i;
  return mathRegex.test(text);
}

function processMathExpression(expression) {
  const symbols = {
    "más": "+",
    "menos": "-",
    "por": "*",
    "dividido por": "/",
    "elevado a": "^",
    "raíz cuadrada de": "√",
    "abrir paréntesis": "(",
    "cerrar paréntesis": ")"
  };

  const processedExpression = expression
    .replace(/\b(?:más|menos|por|dividido por|elevado a|raíz cuadrada de|abrir paréntesis|cerrar paréntesis)\b/g, match => symbols[match]);

  return processedExpression;
}

function speechToText() {
  try {
    recognition = new SpeechRecognition();
    recognition.lang = inputLanguage.value;
    recognition.interimResults = true;
    recordBtn.classList.add("recording");
    recordBtn.querySelector("p").innerHTML = "Listening...";
    recognition.start();

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      // Detect when interim results
      if (event.results[0].isFinal) {
        result.innerHTML += " " + speechResult;
        result.querySelector("p").remove();

        // Check if the speech result is a math expression
        if (isMathExpression(speechResult)) {
          const processedExpression = processMathExpression(speechResult);
          // You can then do something with the processed math expression
          // For example, evaluate it or display it.
          console.log("Processed Math Expression:", processedExpression);
        }

        // Apply style changes to the final result element as well
        result.style.color = colorSelect.value;
        result.style.fontSize = sizeSelect.value + "px";
        result.style.fontFamily = fontSelect.value;
      } else {
        // Create a new p with class interim if not already there
        if (!document.querySelector(".interim")) {
          const interim = document.createElement("p");
          interim.classList.add("interim");
          result.appendChild(interim);
        }
        // Update the interim p with the speech result
        const interimElement = document.querySelector(".interim");
        interimElement.innerHTML = " " + speechResult;

        // Apply style changes in real-time to the interim element
        interimElement.style.color = colorSelect.value;
        interimElement.style.fontSize = sizeSelect.value + "px";
        interimElement.style.fontFamily = fontSelect.value;
      }
      downloadBtn.disabled = false;
    };

    recognition.onspeechend = () => {
      speechToText();
    };

    recognition.onerror = (event) => {
      stopRecording();
      if (event.error === "no-speech") {
        alert("No speech was detected. Stopping...");
      } else if (event.error === "audio-capture") {
        alert("No microphone was found. Ensure that a microphone is installed.");
      } else if (event.error === "not-allowed") {
        alert("Permission to use microphone is blocked.");
      } else if (event.error === "aborted") {
        alert("Listening Stopped.");
      } else {
        alert("Error occurred in recognition: " + event.error);
      }
    };
  } catch (error) {
    recording = false;
    console.log(error);
  }
}


recordBtn.addEventListener("click", () => {
  if (!recording) {
    speechToText();
    recording = true;
  } else {
    stopRecording();
  }
});

function stopRecording() {
  recognition.stop();
  recordBtn.querySelector("p").innerHTML = "Detectando discurso";
  recordBtn.classList.remove("recording");
  recording = false;
  // No limpiamos finalTranscript al detener el reconocimiento
}

function stripHtml(html) {
  const temporalElement = document.createElement("div");
  temporalElement.innerHTML = html;
  return temporalElement.textContent.trim();
}

function downloadPDF() {
  const content = stripHtml(result.innerHTML); // Eliminamos las etiquetas HTML

  // Crear un objeto PDF con jsPDF
  const pdf = new jsPDF();

  // Dividir el contenido en líneas que caben en el ancho especificado
  const splitText = pdf.splitTextToSize(content, 200);

  // Colocar el contenido en el PDF
  pdf.text(splitText, 10, 15);

  // Guardar el PDF con el nombre "speech.pdf"
  pdf.save("Transcripcion.pdf");
}

function formatText(text, maxLineLength) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxLineLength) {
      if (currentLine !== '') {
        currentLine += ' ';
      }
      currentLine += word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine !== '') {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

function download() {
  const text = result.innerText;
  const filename = "transcripcion.txt";
  const maxLineLength = 50; // Establece el ancho máximo de línea deseado.

  const formattedText = formatText(text, maxLineLength);

  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(formattedText));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

downloadBtn.addEventListener("click", download);
downloadBtn.addEventListener("click", downloadPDF);

clearBtn.addEventListener("click", () => {
  result.innerHTML = "";
  finalTranscript = ""; // Limpiar los resultados finales al hacer clic en el botón "Clear"
  downloadBtn.disabled = true;
});

// Función para pausar o reanudar el reconocimiento
function togglePause() {
  if (!recording) {
    return; // Salir si no se está grabando
  }

  if (recognition.paused) {
    // Si la reconocimiento está pausado, reanudarlo
    recognition.start();
    updateButtonText("Listening...");
  } else {
    // Si la reconocimiento está activo, pausarlo
    recognition.stop();
    updateButtonText("Paused");
  }
}

// Función para actualizar el texto del botón
function updateButtonText(text) {
  const buttonTextElement = recordBtn.querySelector("p");
  if (buttonTextElement) {
    buttonTextElement.innerHTML = text;
  }
}



recordBtn.addEventListener("dblclick", togglePause);


const div = document.querySelector('.result');

// Obtener la altura total del contenido del div
const height = div.scrollHeight;

// Establecer un intervalo para comprobar la posición del scroll
setInterval(() => {
  // Si el scroll está en la parte inferior del div
  if (div.scrollTop + div.clientHeight >= height) {
    // Desplazar el div hacia abajo
    div.scrollTop += 500;
  }
}, 50);


const letra = document.getElementById("letra");
const colorSelect = document.getElementById("color-select");
const sizeSelect = document.getElementById("size-select");
const fontSelect = document.getElementById("font-select");

function applyChanges() {
  letra.style.color = colorSelect.value;
  letra.style.fontSize = sizeSelect.value + "px";
  letra.style.fontFamily = fontSelect.value;

  // Guardar la selección en localStorage para recordarla
  localStorage.setItem("color", colorSelect.value);
  localStorage.setItem("size", sizeSelect.value);
  localStorage.setItem("font", fontSelect.value);
}

document.addEventListener("DOMContentLoaded", function () {
  // Esta función se ejecutará una vez que el DOM esté completamente cargado.

  const savedColor = localStorage.getItem("color");
  const savedSize = localStorage.getItem("size");
  const savedFont = localStorage.getItem("font");

  // Restaurar las preferencias guardadas desde localStorage
  if (savedColor) {
    colorSelect.value = savedColor;
  }
  if (savedSize) {
    sizeSelect.value = savedSize;
  }
  if (savedFont) {
    fontSelect.value = savedFont;
  }

  // Aplicar los cambios iniciales
  applyChanges();

  // Agregar escuchas de eventos para guardar preferencias al cambiar
  colorSelect.addEventListener("input", applyChanges);
  sizeSelect.addEventListener("input", applyChanges);
  fontSelect.addEventListener("input", applyChanges);
});
