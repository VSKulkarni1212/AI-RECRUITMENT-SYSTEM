import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './api-config'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase URL or Anon Key is missing in frontend configuration.")
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
