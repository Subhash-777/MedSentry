DO $$
DECLARE
  v_user_id uuid;
  v_admin_id uuid;
  v_drug_id uuid;
BEGIN
  -- Target the known-good test account explicitly
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'subhashravichandran7432@gmail.com';
  
  -- Use the same known user for the admin ID
  v_admin_id := v_user_id;
  
  -- Grab any valid drug
  SELECT id INTO v_drug_id FROM public.drugs LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Target account subhashravichandran7432@gmail.com not found in auth.users. Aborting.';
  END IF;

  RAISE NOTICE 'Injecting 500 medication courses for user %', v_user_id;

  -- Insert 500 medication courses
  FOR i IN 1..500 LOOP
    INSERT INTO public.medication_courses (
      user_id, 
      drug_id, 
      total_pills, 
      daily_dose, 
      dosage_amount,
      frequency, 
      instructions, 
      status, 
      days_remaining, 
      custom_name
    ) VALUES (
      v_user_id,
      v_drug_id,
      30,
      1,
      '1 pill',
      ARRAY['morning'],
      'Take with water - Synthetic load',
      'active',
      30,
      'Perf Test Med ' || i
    );
  END LOOP;

  RAISE NOTICE 'Injecting 1000 admin audit logs...';

  -- Insert 1000 audit logs
  FOR i IN 1..1000 LOOP
    INSERT INTO public.admin_audit_log (
      admin_id, 
      target_user_id, 
      action, 
      details
    ) VALUES (
      v_admin_id,
      v_user_id,
      'update_profile',
      ('{"reason": "Synthetic Perf Load", "index": ' || i || '}')::jsonb
    );
  END LOOP;

  RAISE NOTICE 'Synthetic data injection complete.';
END $$;
