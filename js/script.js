let stream;
    let detectionAnimationFrame;
    let model;
    const startModal = document.getElementById('startModal');
    const videoElement = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    function renderPredictions(predictions) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.font = "18px Arial";
        ctx.fillStyle = "#00FFFF";
        ctx.fillText(prediction.class, x, y > 10 ? y - 5 : 10);
      });
    }
    async function detectFrame(video, model) {
      const predictions = await model.detect(video);
      renderPredictions(predictions);
      detectionAnimationFrame = requestAnimationFrame(() => detectFrame(video, model));
    }
    startModal.addEventListener('shown.bs.modal', async function() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        videoElement.play();
        videoElement.onloadedmetadata = async function() {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          if (!model) {
            model = await cocoSsd.load();
          }
          detectFrame(videoElement, model);
        };
      } catch (err) {
        console.error("Fehler beim Zugriff auf die Kamera: ", err);
      }
    });
    startModal.addEventListener('hidden.bs.modal', function() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      if (detectionAnimationFrame) {
        cancelAnimationFrame(detectionAnimationFrame);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      videoElement.srcObject = null;
    });