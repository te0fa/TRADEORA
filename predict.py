import sys
import joblib
import traceback
import numpy as np

try:
    tf = sys.argv[1]
    features = [float(x) for x in sys.argv[2].split(',')]
    assert len(features) == 14, f"Expected 14 features, got {len(features)}"

    # Attempt to load model and scaler
    model = joblib.load(f'models/model_{tf}.pkl')
    scaler = joblib.load(f'models/scaler_{tf}.pkl')

    # Predict
    X = scaler.transform([features])
    prob = model.predict_proba(X)[0][1]
    print(f"{prob:.4f}")

except Exception as e:
    # Print fallback default neutral probability to stdout
    print("0.5000")
    
    # Log the exact exception to models/prediction_errors.log
    try:
        import os
        os.makedirs('models', exist_ok=True)
        with open('models/prediction_errors.log', 'a', encoding='utf-8') as f:
            f.write(f"--- Exception occurred in predict.py ---\n")
            f.write(f"Args: {sys.argv}\n")
            f.write(f"Error: {str(e)}\n")
            traceback.print_exc(file=f)
            f.write("\n")
    except Exception as log_err:
        # Ignore errors writing to log to ensure we exit 0
        pass

    sys.exit(0)
