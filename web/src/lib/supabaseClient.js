import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://gownldbtbqpmdtjgjkjp.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvd25sZGJ0YnFwbWR0amdqa2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MDk1MTcsImV4cCI6MjEwNjA4NTUxN30.bUYJFfksPCHoNGAj7J71Vua5LEcExbOKWSB16RpkUGc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
