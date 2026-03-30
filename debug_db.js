import { createClient } from '@supabase/supabase-client'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
  const { data, error } = await supabase
    .from('produtos')
    .select('peca, categoria')
    .order('peca')
  
  if (error) {
    console.error('Erro:', error)
  } else {
    console.table(data)
  }
}

debug()
