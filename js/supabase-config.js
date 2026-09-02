// Preencha com os dados do seu projeto Supabase (Project Settings > API)
// SUPABASE_ANON_KEY é uma chave pública, segura para expor no front-end.
const SUPABASE_URL = 'COLE_AQUI_A_SUA_PROJECT_URL';
const SUPABASE_ANON_KEY = 'COLE_AQUI_A_SUA_ANON_PUBLIC_KEY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
