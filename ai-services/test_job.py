from app.services.scheduler_service import SchedulerService
import logging
import sys

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

def run():
    print("Testing verification job directly...")
    s = SchedulerService()
    s.job_autonomous_institution_verification()
    print("Job completed.")

if __name__ == '__main__':
    run()
