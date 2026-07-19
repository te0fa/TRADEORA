-- Create helper RPC to delete snapshots in chunks without timeouts
CREATE OR REPLACE FUNCTION delete_old_snapshots_chunked(p_cutoff text, p_limit int)
RETURNS int AS $$
DECLARE
    deleted_count int;
BEGIN
    DELETE FROM intraday_snapshots
    WHERE id IN (
        SELECT id FROM intraday_snapshots
        WHERE created_at < p_cutoff::timestamptz
        LIMIT p_limit
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
