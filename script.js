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
    recordBtn.querySelector("p").innerHTML = "Detectando discurso...";
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
        alert("No se ha detectado voz, deteniendo...");
      } else if (event.error === "audio-capture") {
        alert("Microfono no detectado, asegurese que cuente con un microfono.");
      } else if (event.error === "not-allowed") {
        alert("El permiso del microfono fue denegado.");
      } else if (event.error === "aborted") {
        alert("Deteccion finalizada.");
      } else {
        alert("A ocurrido un error en el reconocimiento: " + event.error);
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
  recordBtn.querySelector("p").innerHTML = "Pausa";
  recordBtn.classList.remove("recording");
  recording = false;
  // No limpiamos finalTranscript al detener el reconocimiento
}

function stripHtml(html) {
  const temporalElement = document.createElement("div");
  temporalElement.innerHTML = html;
  return temporalElement.textContent.trim();
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

function downloadPDF() {
  const selectedCatedratico = document.getElementById("cated-select").value;
  const selectedCurso = document.getElementById("curso-select").value;

  // Obtener la fecha actual en el formato deseado (por ejemplo, YYYY-MM-DD)
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');

  const content = `\n\nCatedrático/a: ${selectedCatedratico}\nCurso: ${selectedCurso}\n\n\n\n${stripHtml(result.innerHTML)}`;
  const filename = `${selectedCurso}-${currentDate}.pdf`;

  // Crear un objeto PDF con jsPDF
  const pdf = new jsPDF();

  // Cambiar la URL de la imagen a una URL en línea válida
  const imageUrl = "https://3.bp.blogspot.com/-CmQKNGbexww/WXVwP14izcI/AAAAAAAABmw/3Wu3ywWhEB4pNj_pRdtJRO4BJLfcu74zgCEwYBhgL/s1600/logo%2Biapc.jpg";

  // Cargar la imagen
  const image = new Image();
  image.src = imageUrl;

  // Ajustar el tamaño de la imagen
  image.width = 29;
  image.height = 29;

const pdfWidth = pdf.internal.pageSize.getWidth();

  // Colocar la imagen en el PDF
  pdf.addImage(image, 'JPEG', pdfWidth - 45, 10, 29, 29);

  // Dividir el contenido en líneas que caben en el ancho especificado
  const splitText = pdf.splitTextToSize(content, 200);

  // Colocar el contenido en el PDF
  pdf.text(splitText, 10, 15);

  // Guardar el PDF con el nombre "speech.pdf"
  pdf.save(filename);
}

function download() {
  const selectedCatedratico = document.getElementById("cated-select").value;
  const selectedCurso = document.getElementById("curso-select").value;
  // Obtener la fecha actual en el formato deseado (por ejemplo, YYYY-MM-DD)
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');

  const text = `Catedrático/a: ${selectedCatedratico}\nCurso: ${selectedCurso}\n\n${result.innerText}`;
  const filename = `${selectedCurso}-${currentDate}.txt`;
  const maxLineLength = 50;

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
    updateButtonText("Detectando Discurso...");
  } else {
    // Si la reconocimiento está activo, pausarlo
    stopRecording();
    updateButtonText("Pausa");
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


// Define una estructura de datos que mapea profesores a cursos
const profesoresCursos = {
  Tania: ["Psicología", "Historia de la educación" , "Filosofía"],
  Pablo: ["Desarrollo Web" , "Base de Datos" , "Redes de computadoras"]
};

// Obtén una referencia al elemento select de profesores
const profesorSelect = document.getElementById("cated-select");
// Obtén una referencia al elemento select de cursos
const cursoSelect = document.getElementById("curso-select");

// Función para cargar las opciones de cursos basadas en el profesor seleccionado
function cargarCursosPorProfesor(profesor) {
  // Limpia las opciones anteriores del select de cursos
  cursoSelect.innerHTML = "";

  if (profesor in profesoresCursos) {
    // Agrega las opciones de cursos para el profesor seleccionado
    const cursos = profesoresCursos[profesor];
    cursos.forEach((curso) => {
      const option = document.createElement("option");
      option.value = curso;
      option.text = curso;
      cursoSelect.appendChild(option);
    });
  }
}

// Agrega un evento change al select de profesores
profesorSelect.addEventListener("change", function () {
  const selectedProfesor = profesorSelect.value;
  cargarCursosPorProfesor(selectedProfesor);
});

// Llama a la función para cargar las opciones de cursos basadas en el profesor seleccionado al cargar la página
document.addEventListener("DOMContentLoaded", function () {
  cargarCursosPorProfesor(profesorSelect.value);
});
