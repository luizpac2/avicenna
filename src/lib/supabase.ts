import { createClient } from '@supabase/supabase-js';

// O Vite usa 'import.meta.env' para ler o arquivo .env que você criou
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Aqui inicializamos a conexão oficial
export const supabase = createClient(supabaseUrl, supabaseAnonKey);