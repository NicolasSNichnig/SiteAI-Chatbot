import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Verificação importante para evitar erros de inicialização
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase env vars missing");
}

export const supabase = createClient(supabaseUrl, supabaseKey);