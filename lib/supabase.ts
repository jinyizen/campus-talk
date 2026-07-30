import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkzyouzzwhgpliafwvnf.supabase.co/'
const supabaseKey = 'sb_publishable_5_UgEgwVE2wR02PY6HPAYw_V8IKoDPQ'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)