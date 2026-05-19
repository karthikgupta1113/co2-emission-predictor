# =============================================================
#  CO₂ Emission Predictor — Flask Backend
#  File: backend/app.py
#
#  Models are trained automatically at startup using the
#  local dataset/FuelConsumptionCo2.csv file.
#  No model.pkl needed — just run the script!
#
#  Run with:
#      pip install flask scikit-learn numpy pandas
#      python backend/app.py
#
#  Then open:  http://127.0.0.1:5000
# =============================================================

from flask import Flask, request, jsonify, send_from_directory
import os
import sys

# Force UTF-8 encoding for Windows console to handle characters like '₂'
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

import numpy as np
import pandas as pd
from sklearn import linear_model
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# ── App setup ─────────────────────────────────────────────────
app = Flask(__name__)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')
CSV_PATH     = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'FuelConsumptionCo2.csv')


# =============================================================
#  LOAD DATASET & TRAIN MODELS AT STARTUP
#  (Copied directly from Simple-Linear-Regression.ipynb)
# =============================================================

print("\n[+] Loading dataset...")
df  = pd.read_csv(CSV_PATH)
cdf = df[['ENGINESIZE', 'CYLINDERS', 'FUELCONSUMPTION_COMB', 'CO2EMISSIONS']]
print(f"    OK  {len(df)} records loaded from FuelConsumptionCo2.csv")

# ── Target variable ──────────────────────────────────────────
y = cdf.CO2EMISSIONS.to_numpy()


# ── Model A: ENGINESIZE ──────────────────────────────────────
print("\n[+] Training Model A --- ENGINESIZE...")

X_engine = cdf.ENGINESIZE.to_numpy()
X_train, X_test, y_train, y_test = train_test_split(
    X_engine, y, test_size=0.2, random_state=42
)

regressor = linear_model.LinearRegression()
regressor.fit(X_train.reshape(-1, 1), y_train)

print(f"    Coefficients : {regressor.coef_[0]:.4f}")
print(f"    Intercept    : {regressor.intercept_:.4f}")

# Evaluation
y_pred_engine = regressor.predict(X_test.reshape(-1, 1))
metrics_engine = {
    'mae' : round(float(mean_absolute_error(y_test, y_pred_engine)), 2),
    'mse' : round(float(mean_squared_error(y_test, y_pred_engine)), 2),
    'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred_engine))), 2),
    'r2'  : round(float(r2_score(y_test, y_pred_engine)), 2),
}
print(f"    MAE  = {metrics_engine['mae']}")
print(f"    MSE  = {metrics_engine['mse']}")
print(f"    RMSE = {metrics_engine['rmse']}")
print(f"    R²   = {metrics_engine['r2']}")


# ── Model B: FUELCONSUMPTION_COMB ────────────────────────────
print("\n[+] Training Model B --- FUELCONSUMPTION_COMB...")

X_fuel = cdf.FUELCONSUMPTION_COMB.to_numpy()
X_train_f, X_test_f, y_train_f, y_test_f = train_test_split(
    X_fuel, y, test_size=0.2, random_state=42
)

regr = linear_model.LinearRegression()
regr.fit(X_train_f.reshape(-1, 1), y_train_f)

print(f"    Coefficients : {regr.coef_[0]:.4f}")
print(f"    Intercept    : {regr.intercept_:.4f}")

# Evaluation
y_pred_fuel = regr.predict(X_test_f.reshape(-1, 1))
metrics_fuel = {
    'mae' : round(float(mean_absolute_error(y_test_f, y_pred_fuel)), 2),
    'mse' : round(float(mean_squared_error(y_test_f, y_pred_fuel)), 2),
    'rmse': round(float(np.sqrt(mean_squared_error(y_test_f, y_pred_fuel))), 2),
    'r2'  : round(float(r2_score(y_test_f, y_pred_fuel)), 2),
}
print(f"    MAE  = {metrics_fuel['mae']}")
print(f"    MSE  = {metrics_fuel['mse']}")
print(f"    RMSE = {metrics_fuel['rmse']}")
print(f"    R²   = {metrics_fuel['r2']}")

print("\n[OK] Both models ready!\n")


# =============================================================
#  ROUTES
# =============================================================

# ─────────────────────────────────────────────────────────────
# GET /
# Serves index.html from the frontend folder.
# ─────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


# Serve static files (style.css, script.js) from frontend/
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


# ─────────────────────────────────────────────────────────────
# POST /predict
# Accepts JSON:  { "engineSize": <float>, "fuelCombined": <float> }
# Returns JSON:  { "co2": <float>,
#                  "co2_by_fuel": <float>,
#                  "model_used": "ENGINESIZE" }
# ─────────────────────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({'error': 'No JSON body received'}), 400

    try:
        engine_size   = float(data.get('engineSize',   0))
        fuel_combined = float(data.get('fuelCombined', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid input values'}), 400

    # Prediction using ENGINESIZE model
    pred_engine = regressor.predict([[engine_size]])[0]

    # Prediction using FUELCONSUMPTION_COMB model
    pred_fuel   = regr.predict([[fuel_combined]])[0]

    return jsonify({
        'co2'         : round(float(pred_engine), 2),   # displayed in UI
        'co2_by_fuel' : round(float(pred_fuel),   2),   # secondary result
        'model_used'  : 'ENGINESIZE',
    })


# ─────────────────────────────────────────────────────────────
# GET /metrics
# Returns computed accuracy metrics for both models.
# Called automatically by the frontend on page load.
# ─────────────────────────────────────────────────────────────
@app.route('/metrics', methods=['GET'])
def get_metrics():
    return jsonify({
        'enginesize_model': metrics_engine,
        'fuel_model'      : metrics_fuel,
    })


# =============================================================
#  RUN
# =============================================================
if __name__ == '__main__':
    print("=" * 55)
    print("  CO2 Emission Predictor --- Flask Backend")
    print("=" * 55)
    print(f"  Dataset  : {os.path.abspath(CSV_PATH)}")
    print(f"  Frontend : {os.path.abspath(FRONTEND_DIR)}")
    print("  URL      : http://127.0.0.1:5000")
    print("=" * 55)
    app.run(host='0.0.0.0', port=10000, debug=False)
