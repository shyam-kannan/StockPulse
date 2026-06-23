from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

from scrapers import run_all_scrapers

scheduler = BackgroundScheduler()


def start_scheduler():
    scheduler.add_job(
        run_all_scrapers,
        "interval",
        hours=2,
        id="scrape_all",
        next_run_time=datetime.now(),
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    print("[Scheduler] Started - scraping every 2 hours")


def stop_scheduler():
    scheduler.shutdown(wait=False)
    print("[Scheduler] Stopped")


def trigger_manual_scrape():
    scheduler.add_job(
        run_all_scrapers,
        id="manual_scrape",
        replace_existing=True,
    )
    print("[Scheduler] Manual scrape triggered")
