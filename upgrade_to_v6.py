with open('generate_daily_recommendations.py', 'r', encoding='utf-8') as f:
    content = f.read()

v5_str = "if os.path.exists('models/model_1d_v5.pkl'):"
v6_str = """if os.path.exists('models/model_1d_v6.pkl'):
    logger.info("🚀 Model v6 (33 Features + VPOC + Seasonality + Investor Flows) detected – upgrading automatically")
    MODEL_VERSION = 'v6'
    _model_path  = 'models/model_1d_v6.pkl'
    _scaler_path = 'models/scaler_1d_v6.pkl'
    _meta_path   = 'models/model_v6_metadata.json'
elif os.path.exists('models/model_1d_v5.pkl'):"""

if v5_str in content and "model_1d_v6.pkl" not in content:
    new_content = content.replace(v5_str, v6_str)
    with open('generate_daily_recommendations.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("✅ Successfully upgraded generate_daily_recommendations.py to Model v6!")
else:
    print("Already upgraded or pattern missing.")
