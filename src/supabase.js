import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ykupntvwlltppfyjyxwh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrdXBudHZ3bGx0cHBmeWp5eHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzkwNTAsImV4cCI6MjA5NDYxNTA1MH0.UFtXO6n43f7M1x44uI1gWH3UCcyiHOZi4CVYbZzXAW8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);