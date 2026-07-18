import sys, joblib, numpy as np

tf       = sys.argv[1]
features = [float(x) for x in sys.argv[2].split(',')]
assert len(features) == 16, f"Expected 16 features, got {len(features)}"

model  = joblib.load(f'models/model_{tf}.pkl')
scaler = joblib.load(f'models/scaler_{tf}.pkl')

X      = scaler.transform([features])
prob   = model.predict_proba(X)[0][1]
print(f"{prob:.4f}")
