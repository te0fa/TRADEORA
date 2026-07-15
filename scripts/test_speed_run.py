import asyncio
import time
import logging
import sys

# Set up simple console logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("test_speed_run")

# Add parent directory to path so we can import scrapers
sys.path.append(".")
from scrapers.mubasher_provider import MubasherProvider

async def main():
    symbols = ["COMI", "FWRY", "SWDY", "ABUK", "EAST"]
    logger.info("Initializing MubasherProvider with max_concurrency=5 on GHA runner...")
    provider = MubasherProvider(max_concurrency=5)
    
    logger.info(f"Starting actual price fetch for {symbols}...")
    start_time = time.time()
    
    try:
        results = await provider.fetch_prices(symbols, bypass_session_guard=True)
        end_time = time.time()
        
        elapsed = end_time - start_time
        logger.info("==================================================")
        logger.info(f"SUCCESS: Fetch completed in {elapsed:.2f} seconds!")
        logger.info(f"Results count: {len(results)}")
        for r in results:
            logger.info(f"  - {r['symbol']}: {r['price']} (Vol: {r['volume']})")
        logger.info("==================================================")
    except Exception as e:
        logger.error(f"FAILURE during fetch: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
