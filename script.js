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
    recordBtn.querySelector("p").innerHTML = "Listening...";
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
          interim.classList.add("subtitle"); // Agregar la clase "subtitle" para aplicar los estilos
          result.appendChild(interim);
        }
        const interimSubtitle = document.querySelector(".interim.subtitle");
        interimSubtitle.innerHTML = interimTranscript;
        interimSubtitle.style.color = colorSelect.value; // Aplicar color seleccionado
        interimSubtitle.style.fontSize = sizeSelect.value + "px"; // Aplicar tamaño seleccionado
        interimSubtitle.style.fontFamily = fontSelect.value; // Aplicar fuente seleccionada
      } else {
        result.querySelector(".interim.subtitle")?.remove(); // Eliminar el elemento interino si no hay texto interino
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

function stripHtml(html) {
  const temporalElement = document.createElement("div");
  temporalElement.innerHTML = html;
  return temporalElement.textContent.trim();
}

function download() {
  const content = stripHtml(result.innerHTML); // Eliminamos las etiquetas HTML y los espacios en blanco

  // Crear un objeto PDF con jsPDF
  const pdf = new jsPDF();

  // Cambiar el ancho máximo a 150 unidades
  const maxWidth = 150;

  // Dividir el contenido en líneas que caben en el ancho especificado
  const splitText = pdf.splitTextToSize(content, maxWidth);

  // Colocar el contenido en el PDF
  pdf.text(splitText, 10, 15, {
    fontSize: 12,
    lineHeight: 1.5,
    textAlign: "justify",
    fitText: true
  });

  // Guardar el PDF con el nombre "speech.pdf"
  pdf.save("speech.pdf");
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
