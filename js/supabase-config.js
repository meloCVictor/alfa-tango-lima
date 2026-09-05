// Preencha com os dados do seu projeto Supabase (Project Settings > API)
// SUPABASE_ANON_KEY é uma chave pública, segura para expor no front-end.
const SUPABASE_URL = 'https://oqaaeoalntsiqybybdta.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_z-k8LnOxUfyb5jD_J1qBZQ_H9XCLONC';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Gestão de Sessão (máximo 60 minutos) =====
const SESSION_MAX_DURATION_MS = 60 * 60 * 1000; // 60 minutos em ms
const SESSION_START_KEY = 'app_session_start_time';

function iniciarSessao() {
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
}

function encerrarSessao() {
    localStorage.removeItem(SESSION_START_KEY);
}

async function verificarSessao() {
    if (!supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        encerrarSessao();
        return null;
    }

    let startStr = localStorage.getItem(SESSION_START_KEY);
    const now = Date.now();

    if (!startStr) {
        // Se há sessão mas não havia horário gravado, inicia a contagem a partir de agora
        iniciarSessao();
        startStr = now.toString();
    }

    const start = parseInt(startStr, 10);
    const decorrido = now - start;

    if (decorrido > SESSION_MAX_DURATION_MS) {
        console.warn('Sessão atingiu o limite de 60 minutos. Efetuando logout...');
        await supabaseClient.auth.signOut();
        encerrarSessao();

        const path = window.location.pathname;
        if (path.includes('area-do-aluno') || path.includes('admin')) {
            window.location.href = 'login.html?expirado=1';
        }
        return null;
    }

    return session;
}
