-- Phase 2 schema additions — deviations from plan.md §4
-- Deviation 2: expiry_date, batch_number, refill_date on medication_courses
-- Rationale: expiry/batch are package-instance properties of the physical box scanned by the user
-- and belong on the row representing "this specific box I'm tracking", not on the drug reference
-- table (drugs) or on the doctor's prescription (prescriptions).
-- refill_date is auto-computed (start_date + days_remaining) and stored so local notifications
-- can be scheduled for it without querying across tables at runtime.

alter table medication_courses
  add column if not exists expiry_date date,
  add column if not exists batch_number text,
  add column if not exists refill_date date;

comment on column medication_courses.expiry_date is
  'Expiry date parsed from the scanned medicine strip/box. Immediate safety check: courses with past expiry_date should be blocked from creation.';

comment on column medication_courses.batch_number is
  'Batch number parsed from the scanned medicine strip/box. Stored only for Phase 2; cross-check against counterfeit/banned-drug advisory data is open scope (no dataset ingested yet).';

comment on column medication_courses.refill_date is
  'Auto-computed at course creation as start_date + days_remaining. Used to schedule a local refill-reminder notification.';
