import sys
import os
import joblib
import traceback
import numpy as np
from supabase import create_client, Client
from config.settings import SUPABASE_URL, SUPABASE_KEY

from datetime import date

def get_supabase() -> Client | None:
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            return create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
    return None

def save_prediction(company_id: str, timeframe: str, probability: float, signal: str = None):
    """
    Saves or updates prediction in ml_predictions table in Supabase.
    """
    supabase = get_supabase()
    if not supabase:
        print("Warning: Supabase credentials missing. Prediction not saved to DB.")
        return

    if signal is None:
        if probability >= 0.65:
            signal = 'BUY'
        elif probability <= 0.35:
            signal = 'SELL'
        else:
            signal = 'NEUTRAL'

    try:
        supabase.table('ml_predictions').upsert({
            'company_id': company_id,
            'timeframe': timeframe,
            'probability': probability,
            'signal_type': signal,
            'predicted_date': date.today().isoformat(),
        }, on_conflict='company_id,timeframe,predicted_date').execute()
        print(f"Prediction saved for company {company_id} [{timeframe}]: {probability:.4f}")
    except Exception as e:
        print(f"Error saving prediction to Supabase: {e}")

if __name__ == "__main__":
    try:
        tf = sys.argv[1]
        features = [float(x) for x in sys.argv[2].split(',')]
        company_id = sys.argv[3] if len(sys.argv) > 3 else None

        if len(features) == 14:
            features.append(0.0)
        if len(features) == 15:
            features.extend([0.0] * 6 + [1.0])
        elif len(features) == 21:
            features.append(1.0)
            
        expected_len = 30 if tf == '1d' else 22
        if len(features) == 22 and expected_len == 30:
            features.extend([0.0] * 7 + [1.0])
            
        assert len(features) == expected_len, f"Expected {expected_len} features for {tf}, got {len(features)}"

        # Attempt to load model and scaler
        model = joblib.load(f'models/model_{tf}.pkl')
        scaler = joblib.load(f'models/scaler_{tf}.pkl')

        # Predict
        X = scaler.transform([features])
        prob = float(model.predict_proba(X)[0][1])
        print(f"{prob:.4f}")

        # If company_id was provided, save to DB
        if company_id:
            save_prediction(company_id, tf, prob)

    except Exception as e:
        print("0.5000")
        try:
            os.makedirs('models', exist_ok=True)
            with open('models/prediction_errors.log', 'a', encoding='utf-8') as f:
                f.write(f"--- Exception occurred in predict.py ---\n")
                f.write(f"Args: {sys.argv}\n")
                f.write(f"Error: {str(e)}\n")
                traceback.print_exc(file=f)
                f.write("\n")
        except Exception:
            pass

        sys.exit(0)
