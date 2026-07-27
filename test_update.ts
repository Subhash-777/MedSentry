import { createClient } from "npm:@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(supabaseUrl, serviceKey);

async function run() {
  const { data, error } = await client.from("medication_courses")
    .update({ necessity_flag: "unclear" })
    .eq("id", "d1307fb1-0386-41d0-9015-b0ed028dc680")
    .eq("user_id", "98d929f7-27b2-475e-91ca-531717639ad4")
    .select();
  console.log("data:", data, "error:", error);
}
run();
