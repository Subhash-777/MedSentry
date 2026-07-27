-- Migration: Phase 6 AMR Heatmap RPC
-- Creates the public-facing aggregated heatmap endpoint with K-anonymity thresholding.

CREATE OR REPLACE FUNCTION public.get_amr_heatmap()
RETURNS TABLE (
    region TEXT,
    drug_category TEXT,
    event_type TEXT,
    total_30d_count BIGINT,
    is_elevated BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    WITH stats AS (
      SELECT
        region,
        drug_category,
        event_type,
        COUNT(*) FILTER (WHERE created_at >= (NOW() - INTERVAL '30 days')) AS total_30d_count,
        COUNT(*) FILTER (WHERE created_at >= (NOW() - INTERVAL '7 days')) AS recent_7d_count,
        COUNT(*) FILTER (WHERE created_at >= (NOW() - INTERVAL '97 days') AND created_at < (NOW() - INTERVAL '7 days')) AS baseline_count,
        -- Get the earliest timestamp in the baseline period to calculate actual elapsed days
        MIN(created_at) FILTER (WHERE created_at >= (NOW() - INTERVAL '97 days') AND created_at < (NOW() - INTERVAL '7 days')) AS baseline_start_dt
      FROM public.misuse_events
      WHERE created_at >= (NOW() - INTERVAL '97 days')
        AND region IS NOT NULL
      GROUP BY region, drug_category, event_type
    )
    SELECT
      region,
      drug_category,
      event_type,
      total_30d_count,
      CASE
        -- 1. Noise filter: Require at least 5 events in the last 7 days to even consider it a spike
        WHEN recent_7d_count < 5 THEN false
        
        -- 2. Minimum data threshold: Require at least 30 days of elapsed baseline data to establish a reliable baseline rate
        WHEN baseline_start_dt IS NULL OR EXTRACT(EPOCH FROM ((NOW() - INTERVAL '7 days') - baseline_start_dt))/86400.0 < 30 THEN false
        
        -- 3. Anomaly detection: 7-day daily average >= 2.5x the actual baseline daily average
        WHEN (recent_7d_count / 7.0) >= 2.5 * (baseline_count / (EXTRACT(EPOCH FROM ((NOW() - INTERVAL '7 days') - baseline_start_dt))/86400.0)) THEN true
        
        ELSE false
      END AS is_elevated
    FROM stats
    WHERE total_30d_count >= 5;
$$;

-- Grant execute to anon and authenticated for the public widget and admin portal
GRANT EXECUTE ON FUNCTION public.get_amr_heatmap() TO anon, authenticated;
