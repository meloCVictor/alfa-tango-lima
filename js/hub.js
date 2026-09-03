// Ajusta o link "Entrar" do hub para mostrar o nome do usuário logado e o atalho certo (aluno ou admin)
document.addEventListener('DOMContentLoaded', async function () {
    const link = document.getElementById('link-area');
    if (!link || typeof supabaseClient === 'undefined') return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: perfil } = await supabaseClient
        .from('profiles')
        .select('nome, is_admin')
        .eq('id', session.user.id)
        .single();

    if (!perfil) return;

    link.textContent = 'Olá, ' + (perfil.nome || 'aluno(a)') + ' →';
    link.href = perfil.is_admin ? 'admin.html' : 'area-do-aluno.html';
});
