/* ── DOM refs ─────────────────────────────────────────────────────────────── */
const fileInput        = document.getElementById('fileInput');
const cameraBtn        = document.getElementById('cameraBtn');
const inputSection     = document.getElementById('inputSection');
const cameraSection    = document.getElementById('cameraSection');
const previewSection   = document.getElementById('previewSection');
const resultSection    = document.getElementById('resultSection');
const errorToast       = document.getElementById('errorToast');
const errorMsg         = document.getElementById('errorMsg');

const videoFeed        = document.getElementById('videoFeed');
const captureCanvas    = document.getElementById('captureCanvas');
const captureBtn       = document.getElementById('captureBtn');
const cancelCameraBtn  = document.getElementById('cancelCameraBtn');

const previewImg       = document.getElementById('previewImg');
const changeBtn        = document.getElementById('changeBtn');
const analyzeBtn       = document.getElementById('analyzeBtn');
const analyzeBtnText   = document.getElementById('analyzeBtnText');
const spinner          = document.getElementById('spinner');

const resultCard       = document.getElementById('resultCard');
const resultIcon       = document.getElementById('resultIcon');
const resultBadge      = document.getElementById('resultBadge');
const resultPlant      = document.getElementById('resultPlant');
const resultDisease    = document.getElementById('resultDisease');
const confidenceFill   = document.getElementById('confidenceFill');
const confidencePct    = document.getElementById('confidencePct');
const resultThumb      = document.getElementById('resultThumb');
const resetBtn         = document.getElementById('resetBtn');

let stream = null;
let currentImageBlob = null;

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function showOnly(...sections) {
  [inputSection, cameraSection, previewSection, resultSection].forEach(s => s.classList.add('hidden'));
  errorToast.classList.add('hidden');
  sections.forEach(s => s.classList.remove('hidden'));
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorToast.classList.remove('hidden');
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

/* ── File Upload ──────────────────────────────────────────────────────────── */
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  currentImageBlob = file;
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  showOnly(previewSection);
  fileInput.value = '';
});

/* ── Camera ───────────────────────────────────────────────────────────────── */
cameraBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
    });
    videoFeed.srcObject = stream;
    showOnly(cameraSection);
  } catch (err) {
    showError('Camera access denied. Please allow camera permission and try again.');
    console.error(err);
  }
});

captureBtn.addEventListener('click', () => {
  const w = videoFeed.videoWidth;
  const h = videoFeed.videoHeight;
  captureCanvas.width  = w;
  captureCanvas.height = h;
  captureCanvas.getContext('2d').drawImage(videoFeed, 0, 0, w, h);
  captureCanvas.toBlob(blob => {
    currentImageBlob = blob;
    previewImg.src = URL.createObjectURL(blob);
    stopCamera();
    showOnly(previewSection);
  }, 'image/jpeg', 0.92);
});

cancelCameraBtn.addEventListener('click', () => {
  stopCamera();
  showOnly(inputSection);
});

/* ── Change image ─────────────────────────────────────────────────────────── */
changeBtn.addEventListener('click', () => {
  currentImageBlob = null;
  showOnly(inputSection);
});

/* ── Analyze ──────────────────────────────────────────────────────────────── */
analyzeBtn.addEventListener('click', async () => {
  if (!currentImageBlob) { showError('No image selected.'); return; }

  // Show loading state
  analyzeBtnText.textContent = 'Analyzing…';
  spinner.classList.remove('hidden');
  analyzeBtn.disabled = true;
  errorToast.classList.add('hidden');

  try {
    const formData = new FormData();
    formData.append('file', currentImageBlob, 'leaf.jpg');

    const response = await fetch('/predict', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Server error');
    }

    displayResult(data);

  } catch (err) {
    showError('Prediction failed: ' + err.message);
    console.error(err);
  } finally {
    analyzeBtnText.textContent = '🔬 Analyze Leaf';
    spinner.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
});

/* ── Display Result ───────────────────────────────────────────────────────── */
function displayResult(data) {
  const { plant, disease, is_healthy, confidence } = data;

  // Status icon & badge
  resultIcon.textContent = is_healthy ? '✅' : '⚠️';
  resultBadge.textContent = is_healthy ? 'Healthy' : 'Disease Detected';
  resultBadge.className = 'result-badge ' + (is_healthy ? 'badge-healthy' : 'badge-unhealthy');

  // Card color scheme
  resultCard.classList.toggle('unhealthy', !is_healthy);

  // Details
  resultPlant.textContent = plant;
  resultDisease.textContent = disease;

  // Thumbnail
  resultThumb.src = previewImg.src;

  // Confidence bar (animate after paint)
  confidenceFill.style.width = '0%';
  confidencePct.textContent = confidence.toFixed(1) + '%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      confidenceFill.style.width = confidence + '%';
    });
  });

  showOnly(resultSection);
}

/* ── Reset ────────────────────────────────────────────────────────────────── */
resetBtn.addEventListener('click', () => {
  currentImageBlob = null;
  previewImg.src = '';
  resultThumb.src = '';
  showOnly(inputSection);
});