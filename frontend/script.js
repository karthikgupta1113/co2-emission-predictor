/* ============================================================
   CO₂ Emission Predictor — script.js
   Handles: input validation, fetch POST to /predict,
            loading state, result display, error handling.
   ============================================================ */

'use strict';

// ─── DOM refs ────────────────────────────────────────────────
const engineInput    = document.getElementById('engineSize');
const fuelInput      = document.getElementById('fuelConsumption');
const predictBtn     = document.getElementById('predictBtn');
const resultCard     = document.getElementById('result-card');
const resultEmpty    = document.getElementById('result-empty');
const resultSkeleton = document.getElementById('result-skeleton');
const resultDisplay  = document.getElementById('result-display');
const resultValue    = document.getElementById('result-value');
const resultBarFill  = document.getElementById('result-bar-fill');
const errEngine      = document.getElementById('err-engine');
const errFuel        = document.getElementById('err-fuel');
const errorToast     = document.getElementById('error-toast');
const toastMsg       = document.getElementById('toast-msg');

// ─── Validation ranges (matching HTML min/max) ────────────────
const RANGES = {
  engineSize:      { min: 0.9,  max: 8.4,  label: 'Engine Size' },
  fuelConsumption: { min: 4.1,  max: 30.6, label: 'Fuel Consumption' },
};

// ─── CO₂ scale for the progress bar (g/km)  ──────────────────
const CO2_MIN = 100;   // ~dataset minimum
const CO2_MAX = 490;   // ~dataset maximum

// ─── Helpers ─────────────────────────────────────────────────
function clearErrors() {
  errEngine.textContent = '';
  errFuel.textContent   = '';
  engineInput.style.borderColor    = '';
  fuelInput.style.borderColor      = '';
}

function showFieldError(inputEl, msgEl, message) {
  msgEl.textContent          = '⚠ ' + message;
  inputEl.style.borderColor  = 'var(--accent-red)';
  inputEl.focus();
}

/**
 * Validates a single numeric field.
 * Returns true if valid, false otherwise.
 */
function validateField(inputEl, msgEl, range) {
  const rawVal = inputEl.value.trim();

  if (rawVal === '') {
    showFieldError(inputEl, msgEl, `${range.label} is required.`);
    return false;
  }

  const num = parseFloat(rawVal);

  if (isNaN(num)) {
    showFieldError(inputEl, msgEl, 'Please enter a valid number.');
    return false;
  }

  if (num < range.min || num > range.max) {
    showFieldError(
      inputEl, msgEl,
      `Value must be between ${range.min} and ${range.max}.`
    );
    return false;
  }

  return true;
}

/** Run full form validation. Returns true only if ALL fields pass. */
function validateForm() {
  clearErrors();
  const okEngine = validateField(engineInput, errEngine, RANGES.engineSize);
  const okFuel   = validateField(fuelInput,   errFuel,   RANGES.fuelConsumption);
  return okEngine && okFuel;
}

// ─── UI state helpers ─────────────────────────────────────────
function setLoadingState(loading) {
  if (loading) {
    predictBtn.disabled = true;
    predictBtn.classList.add('loading');
    // show skeleton, hide others
    resultEmpty.style.display    = 'none';
    resultDisplay.classList.remove('visible');
    resultSkeleton.classList.add('visible');
  } else {
    predictBtn.disabled = false;
    predictBtn.classList.remove('loading');
    resultSkeleton.classList.remove('visible');
  }
}

function showResult(co2Value) {
  resultDisplay.classList.add('visible');
  resultCard.classList.add('has-result');

  // Animate number
  animateValue(resultValue, 0, co2Value, 800);

  // Animate progress bar (clamp between CO2_MIN and CO2_MAX)
  const pct = Math.min(
    Math.max(((co2Value - CO2_MIN) / (CO2_MAX - CO2_MIN)) * 100, 0),
    100
  );
  setTimeout(() => { resultBarFill.style.width = pct + '%'; }, 50);
}

/** Smoothly count up a number in an element */
function animateValue(el, from, to, duration) {
  const start = performance.now();
  const isFloat = !Number.isInteger(to);

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current  = from + (to - from) * ease;
    el.textContent = isFloat ? current.toFixed(2) : Math.round(current);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ─── Toast helper ─────────────────────────────────────────────
let toastTimer = null;

function showToast(message, duration = 4000) {
  toastMsg.textContent = message;
  errorToast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    errorToast.classList.remove('visible');
  }, duration);
}

// ─── Main predict function ────────────────────────────────────
async function handlePredict() {
  if (!validateForm()) return;

  const engineSize    = parseFloat(engineInput.value.trim());
  const fuelCombined  = parseFloat(fuelInput.value.trim());

  setLoadingState(true);

  try {
    const response = await fetch('/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        engineSize:    engineSize,
        fuelCombined:  fuelCombined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();

    setLoadingState(false);

    // If backend returns a numeric CO₂ value
    if (typeof data.co2 === 'number') {
      showResult(data.co2);
    } else {
      // Placeholder response from backend (model not loaded yet)
      resultDisplay.classList.add('visible');
      resultValue.textContent = '—';
      resultBarFill.style.width = '0%';
      showToast('Backend is active but model is not loaded yet. Paste your model code into app.py!', 5000);
    }
  } catch (err) {
    setLoadingState(false);

    // Show empty state again
    resultEmpty.style.display = 'flex';

    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      showToast('⚡ Cannot reach the Flask backend. Run: python backend/app.py');
    } else {
      showToast(`Error: ${err.message}`);
    }

    console.error('[CO₂ Predictor] Fetch error:', err);
  }
}

// ─── Event listeners ──────────────────────────────────────────
predictBtn.addEventListener('click', handlePredict);

// Allow Enter key submission from either input
engineInput.addEventListener('keydown',  (e) => { if (e.key === 'Enter') handlePredict(); });
fuelInput.addEventListener('keydown',    (e) => { if (e.key === 'Enter') handlePredict(); });

// Clear field error on input
engineInput.addEventListener('input', () => {
  errEngine.textContent          = '';
  engineInput.style.borderColor  = '';
});

fuelInput.addEventListener('input', () => {
  errFuel.textContent          = '';
  fuelInput.style.borderColor  = '';
});

// ─── Auto-fill metrics from /metrics endpoint ─────────────────

/**
 * IDs of the <td> cells in the metrics tables.
 * Must match the order: MAE, MSE, RMSE, R²
 * These are added as data-metric attributes in index.html.
 */
function fillMetricsTable(modelKey, metricsObj) {
  const ids = {
    enginesize_model: ['eng-mae', 'eng-mse', 'eng-rmse', 'eng-r2'],
    fuel_model:       ['fuel-mae','fuel-mse','fuel-rmse','fuel-r2'],
  };
  const keys  = ['mae', 'mse', 'rmse', 'r2'];
  const cells = ids[modelKey];
  if (!cells) return;

  cells.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = metricsObj[keys[i]];
      el.classList.remove('placeholder-val');
      el.classList.add('val-mono');
    }
  });
}

async function fetchMetrics() {
  try {
    const res  = await fetch('/metrics');
    if (!res.ok) return;                    // server not ready yet
    const data = await res.json();
    fillMetricsTable('enginesize_model', data.enginesize_model);
    fillMetricsTable('fuel_model',       data.fuel_model);
    console.log('%c📊 Live metrics loaded from /metrics', 'color:#388bfd');
  } catch (_) {
    // Flask server not running — keep the placeholder text
    console.warn('[CO₂ Predictor] /metrics not reachable — running standalone?');
  }
}

// ─── Init ─────────────────────────────────────────────────────
console.log('%c🌿 CO₂ Emission Predictor loaded', 'color:#3fb950;font-weight:bold;font-size:14px');
console.log('POST /predict endpoint → flask backend/app.py');

// Fetch live metrics as soon as the page loads
fetchMetrics();
