import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

// Used for storing generated PDFs & the uploaded company logo in Supabase Storage.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const PDF_BUCKET = "salary-slips";
export const LOGO_BUCKET = "Leatherssc-assets";
