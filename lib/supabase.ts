"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://abxmblwgsuiayfhkwzvu.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_4UPZc_tskGgpcL_HI9J7uA_5CCaGeJI";

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// Transitional client for the V1 archive screens that query legacy tables by name.
// New modules should use the schema-typed `supabase` client above.
export const legacySupabase = supabase as unknown as SupabaseClient;
