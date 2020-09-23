BEGIN;

-- Delete completed and errored sync jobs except the most recent one
-- for each external service.
CREATE FUNCTION delete_completed_external_service_sync_jobs() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        IF (NEW.state = 'completed') THEN
           DELETE FROM external_service_sync_jobs WHERE id IN (
                SELECT id FROM (
                    SELECT *,
                    rank() OVER (
                        PARTITION BY external_service_id
                        ORDER BY finished_at DESC
                    )
                    FROM external_service_sync_jobs
                    WHERE state = 'completed'
                ) ranked_jobs
                WHERE RANK > 1
            );
        END IF;

        IF (NEW.state = 'errored') THEN
            DELETE FROM external_service_sync_jobs WHERE id IN (
                SELECT id FROM (
                    SELECT *,
                    rank() OVER (
                        PARTITION BY external_service_id
                        ORDER BY finished_at DESC
                    )
                    FROM external_service_sync_jobs
                    WHERE state = 'errored'
                ) ranked_jobs
                WHERE RANK > 1
            );
        END IF;

        RETURN NULL;
    END;
$$;

CREATE TRIGGER trig_delete_completed_external_service_sync_jobs AFTER UPDATE OF state ON external_service_sync_jobs FOR EACH ROW EXECUTE PROCEDURE delete_completed_external_service_sync_jobs();

COMMIT;
