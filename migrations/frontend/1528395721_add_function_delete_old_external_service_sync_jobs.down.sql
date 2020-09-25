BEGIN;

DROP FUNCTION IF EXISTS delete_old_external_service_sync_jobs(job_state TEXT);

COMMIT;
