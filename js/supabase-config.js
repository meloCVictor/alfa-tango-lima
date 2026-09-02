// Preencha com os dados do seu projeto Supabase (Project Settings > API)
// SUPABASE_ANON_KEY é uma chave pública, segura para expor no front-end.
const SUPABASE_URL = 'https://oqaaeoalntsiqybybdta.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_z-k8LnOxUfyb5jD_J1qBZQ_H9XCLONC';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
