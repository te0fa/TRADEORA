import os
import sys
import json
import time
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

def export_intraday_data():
    print("Initializing Supabase Client...", flush=True)
    load_dotenv(dotenv_path=Path('tradeora-web/.env.local'))
    sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')) # Use Anon Key for rate limiting resilience
    
    output_dir = Path('data/historical_exports')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    sources = ['tradingview_1h', 'tradingview_4h', 'tradingview_30m']
    
    for src in sources:
        # Check if file already exists to resume and avoid re-downloading finished chunks if timeout happens
        output_file = output_dir / f"export_{src}.parquet"
        if output_file.exists():
            try:
                test_df = pd.read_parquet(output_file)
                if len(test_df) > 400000:
                    print(f"File for source {src} already fully exported and verified ({len(test_df)} rows). Skipping...", flush=True)
                    continue
            except:
                pass

        print(f"Exporting data for source: {src}...", flush=True)
        all_chunks = []
        limit = 1000
        offset = 0
        has_more = True
        
        while has_more:
            try:
                res = sb.table('intraday_snapshots')\
                        .select('company_id, snapshot_time, price, open_price, high_price, low_price, volume, source, created_at')\
                        .eq('source', src)\
                        .range(offset, offset + limit - 1)\
                        .execute()
                
                data = res.data if res.data else []
                chunk_len = len(data)
                all_chunks.extend(data)
                
                if chunk_len > 0 and offset % 50000 == 0:
                    print(f"  Fetched {offset + chunk_len} records...", flush=True)
                
                if chunk_len < limit:
                    has_more = False
                else:
                    offset += limit
                
                # Dynamic delay to avoid Postgres session locks and statement timeout limits on Supabase
                time.sleep(0.05)
            except Exception as inner_e:
                print(f"  Error at offset {offset}: {inner_e}. Retrying in 5 seconds...", flush=True)
                time.sleep(5)
                
        if all_chunks:
            df = pd.DataFrame(all_chunks)
            print(f"Saving {len(df)} records to {output_file}...", flush=True)
            df.to_parquet(output_file, compression='snappy')
            print(f"Successfully saved {output_file} ✅", flush=True)
        else:
            print(f"No records found for source {src}", flush=True)

if __name__ == '__main__':
    export_intraday_data()
