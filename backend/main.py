import os
import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database import init_db
    from scheduler import start_scheduler, stop_scheduler

    print("StockPulse backend starting up...")
    await init_db()
    start_scheduler()
    yield
    stop_scheduler()
    print("StockPulse backend shutting down...")


app = FastAPI(title="StockPulse API", version="0.1.0", lifespan=lifespan)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time(), "version": "0.1.0"}


@app.post("/api/scrape")
async def trigger_scrape():
    from scheduler import trigger_manual_scrape
    trigger_manual_scrape()
    return {"status": "scraping started", "timestamp": time.time()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
