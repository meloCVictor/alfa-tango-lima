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
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    document.getElementById('carregando').style.display = 'none';

    if (erroPerfil || !perfil || !perfil.is_admin) {
        document.getElementById('sem-permissao').style.display = 'block';
        return;
    }

    document.getElementById('painel').style.display = 'block';
    await carregarAlunos();
});

async function carregarAlunos() {
    const lista = document.getElementById('lista-alunos');
    lista.innerHTML = '<p style="color: var(--cinza-claro);">Carregando alunos...</p>';

    const { data: alunos, error } = await supabaseClient
        .from('profiles')
        .select('id, nome, email, telefone, cargo, liberado, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        lista.innerHTML = '<p style="color: var(--vermelho-urgencia);">Erro ao carregar alunos: ' + error.message + '</p>';
        return;
    }

    if (!alunos || alunos.length === 0) {
        lista.innerHTML = '<p style="color: var(--cinza-claro);">Nenhum aluno cadastrado ainda.</p>';
        return;
    }

    lista.innerHTML = '';
    alunos.forEach(function (aluno) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        card.style.gap = '16px';

        const status = aluno.liberado
            ? '<span style="color: #16a34a; font-weight: 700;">✓ Liberado</span>'
            : '<span style="color: var(--vermelho-urgencia); font-weight: 700;">Aguardando pagamento</span>';

        card.innerHTML =
            '<div>' +
                '<strong style="color: var(--verde-escuro);">' + (aluno.nome || '(sem nome)') + '</strong><br>' +
                '<span style="font-size: 0.85rem; color: var(--cinza-claro);">' + aluno.email + ' · ' + (aluno.telefone || '-') + '</span><br>' +
                '<span style="font-size: 0.8rem;">' + status + '</span>' +
            '</div>';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = aluno.liberado ? 'Revogar acesso' : 'Liberar acesso';
        btn.style.cssText = 'padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; color: white; background: ' +
            (aluno.liberado ? 'var(--vermelho-urgencia)' : 'var(--verde-principal)') + ';';
        btn.addEventListener('click', async function () {
            btn.disabled = true;
            btn.textContent = 'Salvando...';
            const { error: erroUpdate } = await supabaseClient
                .from('profiles')
                .update({ liberado: !aluno.liberado })
                .eq('id', aluno.id);

            if (erroUpdate) {
                alert('Erro ao atualizar: ' + erroUpdate.message);
                btn.disabled = false;
                btn.textContent = aluno.liberado ? 'Revogar acesso' : 'Liberar acesso';
                return;
            }
            await carregarAlunos();
        });

        card.appendChild(btn);
        lista.appendChild(card);
    });
}
