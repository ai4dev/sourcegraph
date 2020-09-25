BEGIN;

-- Delete old sync jobs except the most recent one for each external service.
CREATE FUNCTION delete_old_external_service_sync_jobs(job_state TEXT) RETURNS VOID
    LANGUAGE plpgsql
    AS $$
    BEGIN
        DELETE FROM external_service_sync_jobs WHERE id IN (
            -- this subquery selects all rows except the top 1
            -- for each group of external services.
            -- It groups all rows by external_service_id,
            -- ranks them from 1 to the number of rows with the same external_service_id,
            -- then skips the first one for each group
            SELECT id FROM (
                SELECT *,
                rank() OVER (
                    PARTITION BY external_service_id
                    ORDER BY finished_at DESC
                )
                FROM external_service_sync_jobs AS jobs
                WHERE state = job_state
            ) ranked_jobs
            WHERE RANK > 1
        );

    END;
$$;

COMMIT;
