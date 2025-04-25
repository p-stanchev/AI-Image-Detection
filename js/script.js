// js/script.js

let stream;
let detectionAnimationFrame;
let model;
let isPaused = false;

const startModal   = document.getElementById('startModal');
const videoElement = document.getElementById('video');
const canvas       = document.getElementById('canvas');
const ctx          = canvas.getContext('2d');
const captureBtn   = document.getElementById('captureBtn');
const toggleBtn    = document.getElementById('toggleBtn');

function renderPredictions(predictions) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  predictions.forEach(pred => {
    const [x, y, w, h] = pred.bbox;
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#00FFFF";
    ctx.fillText(pred.class, x, y > 10 ? y - 5 : 10);
  });
}

async function detectFrame(video, model) {
  const predictions = await model.detect(video);
  renderPredictions(predictions);
  detectionAnimationFrame = requestAnimationFrame(() => {
    if (!isPaused) detectFrame(video, model);
  });
}

startModal.addEventListener('shown.bs.modal', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.play();

    videoElement.onloadedmetadata = async () => {
      canvas.width  = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      if (!model) {
        model = await cocoSsd.load();
      }
      isPaused = false;
      toggleBtn.textContent = 'Pause';
      detectFrame(videoElement, model);
    };
  } catch (err) {
    console.error("Fehler beim Zugriff auf die Kamera:", err);
  }
});

startModal.addEventListener('hidden.bs.modal', () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  if (detectionAnimationFrame) {
    cancelAnimationFrame(detectionAnimationFrame);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  videoElement.srcObject = null;
  isPaused = false;
  toggleBtn.textContent = 'Pause';
});

toggleBtn.addEventListener('click', () => {
  if (!isPaused) {
    videoElement.pause();
    cancelAnimationFrame(detectionAnimationFrame);
    toggleBtn.textContent = 'Weiter';
    isPaused = true;
  } else {
    videoElement.play();
    isPaused = false;
    toggleBtn.textContent = 'Pause';
    detectFrame(videoElement, model);
  }
});

captureBtn.addEventListener('click', () => {
  const tmp = document.createElement('canvas');
  tmp.width  = canvas.width;
  tmp.height = canvas.height;
  const tctx = tmp.getContext('2d');

  tctx.drawImage(videoElement, 0, 0, tmp.width, tmp.height);
  tctx.drawImage(canvas,       0, 0, tmp.width, tmp.height);

  const link = document.createElement('a');
  link.href = tmp.toDataURL('image/png');
  link.download = 'snapshot.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
