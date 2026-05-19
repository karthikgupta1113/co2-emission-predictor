# 🌿 CO₂ Emission Predictor

A clean, beginner-friendly Machine Learning portfolio project that predicts **vehicle CO₂ emissions** using **Simple Linear Regression** trained on the FuelConsumptionCo2 dataset.

**Stack:** Python (Flask) · HTML · CSS · JavaScript · scikit-learn

---

## 1. Project Description

This project demonstrates a complete end-to-end ML pipeline:

- **Data:** `FuelConsumptionCo2.csv` — 1,067 Canadian vehicle records (2014)
- **Model:** Simple Linear Regression via `sklearn.linear_model.LinearRegression`
- **Features trained:**
  - `ENGINESIZE` (liters) → predicts CO₂ emissions (g/km)
  - `FUELCONSUMPTION_COMB` (L/100km) → predicts CO₂ emissions (g/km)
- **Target:** `CO2EMISSIONS` (grams per kilometre)

The frontend sends inputs to a Flask REST API which runs the trained model and returns a CO₂ prediction displayed live in the browser.

---

## 2. Folder Structure

```
co2-predictor/
├── frontend/
│   ├── index.html        ← Main UI (dark ML dashboard)
│   ├── style.css         ← Dark theme, card layout, animations
│   └── script.js         ← Validation, fetch, loading, result display
├── backend/
│   └── app.py            ← Flask app (paste your model code here)
├── dataset/
│   └── FuelConsumptionCo2.csv   ← Raw dataset
├── models/
│   └── model.pkl         ← Your trained model goes here
└── README.md
```

---

## 3. How to Run

### Prerequisites

```bash
pip install flask scikit-learn numpy
```

### Steps

```bash
# 1. Clone / open this folder in your terminal

# 2. Start the Flask backend
python backend/app.py

# 3. Open your browser at:
#    http://127.0.0.1:5000
```

The Flask app automatically serves the `frontend/` folder, so no separate web server is needed.

---

## 4. How to Add Your Trained Model

Once you have run `Simple-Linear-Regression.ipynb` and trained your model, follow these steps:

### Step 1 — Save your model to `models/model.pkl`

Add this to the end of your notebook:

```python
import pickle

# Save the ENGINESIZE model
with open('../models/model.pkl', 'wb') as f:
    pickle.dump(regressor, f)

print("Model saved to models/model.pkl ✅")
```

### Step 2 — Open `backend/app.py` and find the comment block

```python
# ── PASTE YOUR MODEL CODE HERE ──────────────────────────────
```

### Step 3 — Replace the placeholder with this code

```python
import pickle
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'model.pkl')
regressor = pickle.load(open(MODEL_PATH, 'rb'))

engine_size   = float(data.get('engineSize', 0))
fuel_combined = float(data.get('fuelCombined', 0))

# Choose one feature (or combine both if you trained a multi-feature model):
prediction = regressor.predict([[engine_size]])[0]

return jsonify({'co2': round(float(prediction), 2)})
```

### Step 4 — Restart the Flask server and test!

```bash
python backend/app.py
```

---

## 5. Dataset Source

- **Dataset:** FuelConsumptionCo2.csv
- **Origin:** Government of Canada — Open Data Portal
  - https://open.canada.ca/data/en/dataset/98f1a129-f628-4ce4-b24d-6f16bf24dd64
- **IBM Skills Network mirror (used in notebook):**
  - https://cf-courses-data.s3.us.cloud-object-storage.appdomain.cloud/IBMDeveloperSkillsNetwork-ML0101EN-SkillsNetwork/labs/Module%202/data/FuelConsumptionCo2.csv

**Key columns used:**

| Column | Description | Range |
|---|---|---|
| `ENGINESIZE` | Engine displacement (L) | 1.0 – 8.4 |
| `FUELCONSUMPTION_COMB` | Combined city/highway fuel use (L/100km) | 4.7 – 25.8 |
| `CO2EMISSIONS` | CO₂ emitted in grams per km | 108 – 488 |

---

## 6. Technologies Used

| Technology | Purpose |
|---|---|
| **Python 3.x** | Backend language |
| **Flask** | Lightweight web framework & REST API |
| **scikit-learn 1.6.0** | `LinearRegression` model training |
| **NumPy 2.2.0** | Numerical operations |
| **pandas 2.2.3** | Dataset loading & exploration |
| **HTML5 / CSS3** | Frontend structure & dark dashboard UI |
| **Vanilla JavaScript (ES2022)** | Input validation, fetch, animations |
| **Google Fonts — Inter & JetBrains Mono** | Typography |

---

## Model Performance

### ENGINESIZE Model

| Metric | Value |
|---|---|
| MAE | 24.10 |
| MSE | 985.94 |
| RMSE | 31.40 |
| R² Score | 0.76 |
| Coefficient | ≈ 38.99 |
| Intercept | ≈ 126.29 |

### FUELCONSUMPTION_COMB Model

| Metric | Value |
|---|---|
| MAE | *(run notebook to compute)* |
| MSE | *(run notebook to compute)* |
| RMSE | *(run notebook to compute)* |
| R² Score | *(run notebook to compute)* |

---

*Built as a beginner ML portfolio project. © 2026*
