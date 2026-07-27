import { createClient } from "npm:@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, anonKey);
async function run() {
  const { data, error } = await client.from("drugs").select("name").limit(1);
  console.log("Anon drugs data:", data, "Error:", error);
}
run();
