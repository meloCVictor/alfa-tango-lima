let usuarios = [];

document.addEventListener('DOMContentLoaded', async function () {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('btn-sair').addEventListener('click', async function () {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });

    const { data: perfil, error: erroPerfil } = await supabaseClient
        .from('profiles')
        .select('nome, is_admin')
        .eq('id', session.user.id)
        .single();

    document.getElementById('carregando').style.display = 'none';

    if (erroPerfil || !perfil || !perfil.is_admin) {
        document.getElementById('sem-permissao').style.display = 'block';
        return;
    }

    const nomeEl = document.getElementById('nome-usuario-logado');
    if (nomeEl) nomeEl.textContent = perfil.nome || session.user.email;

    document.getElementById('painel').style.display = 'block';

    await carregarUsuarios();

    document.getElementById('busca-usuario').addEventListener('input', function () {
        renderUsuarios(this.value.trim().toLowerCase());
    });
});

async function carregarUsuarios() {
    const lista = document.getElementById('lista-usuarios');
    lista.innerHTML = '<p style="color: var(--cinza-claro);">Carregando usuários...</p>';

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, nome, email, telefone, cargo, is_admin, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        lista.innerHTML = '<p style="color: var(--vermelho-urgencia);">Erro ao carregar usuários: ' + error.message + '</p>';
        return;
    }

    usuarios = data || [];
    renderUsuarios('');
}

function renderUsuarios(filtro) {
    const lista = document.getElementById('lista-usuarios');

    const filtrados = usuarios.filter(function (u) {
        if (!filtro) return true;
        return (u.nome || '').toLowerCase().includes(filtro) || (u.email || '').toLowerCase().includes(filtro);
    });

    if (filtrados.length === 0) {
        lista.innerHTML = '<p style="color: var(--cinza-claro);">Nenhum usuário encontrado.</p>';
        return;
    }

    lista.innerHTML = '';
    filtrados.forEach(function (usuario) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        card.style.gap = '16px';

        const badgeAdmin = usuario.is_admin
            ? '<span style="font-size: 0.75rem; background: var(--verde-principal); color: white; padding: 2px 8px; border-radius: 50px; margin-left: 8px;">admin</span>'
            : '';

        card.innerHTML =
            '<div>' +
                '<strong style="color: var(--verde-escuro);">' + (usuario.nome || '(sem nome)') + '</strong>' + badgeAdmin + '<br>' +
                '<span style="font-size: 0.85rem; color: var(--cinza-claro);">' + usuario.email + ' · ' + (usuario.telefone || '-') + '</span>' +
            '</div>';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = usuario.is_admin ? 'Remover admin' : 'Tornar admin';
        btn.style.cssText = 'padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; color: white; flex-shrink: 0; background: ' +
            (usuario.is_admin ? 'var(--vermelho-urgencia)' : 'var(--verde-principal)') + ';';
        btn.addEventListener('click', async function () {
            const novoValor = !usuario.is_admin;
            if (novoValor && !confirm('Tornar "' + (usuario.nome || usuario.email) + '" administrador da plataforma?')) return;

            btn.disabled = true;
            btn.textContent = 'Salvando...';
            const { error } = await supabaseClient
                .from('profiles')
                .update({ is_admin: novoValor })
                .eq('id', usuario.id);

            if (error) {
                alert('Erro ao atualizar: ' + error.message);
                btn.disabled = false;
                btn.textContent = usuario.is_admin ? 'Remover admin' : 'Tornar admin';
                return;
            }
            await carregarUsuarios();
        });

        card.appendChild(btn);
        lista.appendChild(card);
    });
}
