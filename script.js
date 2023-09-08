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
    recognition.lang = inputLanguage.value;
    recognition.interimResults = true;
    recordBtn.classList.add("recording");
    recordBtn.querySelector("p").innerHTML = "Detectando Discurso";
    recognition.start();
    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i][0];
        if (result.isFinal) {
          const transcript = result.transcript.trim();
          finalTranscript += " " + transcript;
          if (isMathExpression(transcript)) {
            finalTranscript = processMathExpression(transcript);
          }
        } else {
          interimTranscript += " " + result.transcript;
        }
      }

      result.innerHTML = finalTranscript;
      if (interimTranscript !== "") {
        if (!document.querySelector(".interim")) {
          const interim = document.createElement("p");
          interim.classList.add("interim");
          result.appendChild(interim);
        }
        document.querySelector(".interim").innerHTML = interimTranscript;
      } else {
        result.querySelector(".interim")?.remove(); // Eliminar el elemento interino si no hay texto interino
      }

      downloadBtn.disabled = false;
    };

    recognition.onend = () => {
      // Solo reiniciamos el reconocimiento si no está en pausa
      if (!recognition.paused) {
        recognition.start();
      }
    };

    recognition.onerror = (event) => {
      stopRecording();
      if (event.error === "no-speech") {
        alert("Discurso no detectado. Deteniendo...");
      } else if (event.error === "audio-capture") {
        alert("Micorfono no encontrado en el sistema.");
      } else if (event.error === "not-allowed") {
        alert("El permiso del microfono fue bloqueado.");
      } else if (event.error === "aborted") {
        alert("Reconociemiento detenido.");
      } else {
        alert("Error ocurrido durante en el reconocimiento: " + event.error);
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

function download() {
  const text = result.innerText;
  const filename = "clase.txt";

  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

downloadBtn.addEventListener("click", download);

clearBtn.addEventListener("click", () => {
  result.innerHTML = "";
  finalTranscript = ""; // Limpiar los resultados finales al hacer clic en el botón "Clear"
  downloadBtn.disabled = true;
});

// Función para pausar o reanudar el reconocimiento
function togglePause() {
  if (recording) {
    if (recognition.paused) {
      recognition.start();
      recordBtn.querySelector("p").innerHTML = "Detectando...";
    } else {
      recognition.stop();
      recordBtn.querySelector("p").innerHTML = "Discurso en Pausa";
    }
  }
}

// Detectar la pausa/reanudación al hacer doble clic en el botón
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