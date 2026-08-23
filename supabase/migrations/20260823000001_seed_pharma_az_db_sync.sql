-- Seed initial pharma_az_db entry in dataset_sync_log
-- This removes the WARNING/UNKNOWN status on the admin dashboard.
-- The dataset is tracked; sync runs are triggered separately by a cron / admin action.

INSERT INTO public.dataset_sync_log (dataset_name, status, last_refreshed_at, details)
VALUES (
  'pharma_az_db',
  'failed',
  now(),
  '{"message": "Initial row — no sync has been run yet. Trigger a sync to populate this dataset."}'::jsonb
)
ON CONFLICT DO NOTHING;
