BEGIN;

DROP TRIGGER IF EXISTS trig_delete_completed_external_service_sync_jobs ON external_service_sync_jobs;

DROP FUNCTION IF EXISTS delete_completed_external_service_sync_jobs();

COMMIT;
