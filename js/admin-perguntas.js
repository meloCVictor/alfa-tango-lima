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

    await carregarPerguntas();
    document.getElementById('filtro-nao-respondidas').addEventListener('change', carregarPerguntas);
});

async function carregarPerguntas() {
    const lista = document.getElementById('lista-perguntas');
    lista.innerHTML = '<p style="color: var(--cinza-claro);">Carregando perguntas...</p>';

    const soNaoRespondidas = document.getElementById('filtro-nao-respondidas').checked;

    let query = supabaseClient
        .from('perguntas')
        .select('id, pergunta, resposta, created_at, profiles(nome, email), modulos(titulo)')
        .order('created_at', { ascending: false });

    if (soNaoRespondidas) {
        query = query.is('resposta', null);
    }

    const { data: perguntas, error } = await query;

    if (error) {
        lista.innerHTML = '<p style="color: var(--vermelho-urgencia);">Erro ao carregar perguntas: ' + error.message + '</p>';
        return;
    }

    if (!perguntas || perguntas.length === 0) {
        lista.innerHTML = '<p style="color: var(--cinza-claro);">Nenhuma pergunta encontrada.</p>';
        return;
    }

    lista.innerHTML = '';
    perguntas.forEach(function (item) {
        const aluno = item.profiles || {};
        const modulo = item.modulos || {};

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML =
            '<p style="font-size: 0.8rem; color: var(--cinza-claro); margin-bottom: 6px;">' +
                (modulo.titulo || 'Aula') + ' · ' + (aluno.nome || aluno.email || 'Aluno') +
            '</p>' +
            '<p style="color: var(--cinza-texto); margin-bottom: 12px;"><strong>Pergunta:</strong> ' + item.pergunta + '</p>';

        const textarea = document.createElement('textarea');
        textarea.className = 'form-input';
        textarea.rows = 3;
        textarea.placeholder = 'Escreva a resposta...';
        textarea.value = item.resposta || '';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Salvar resposta';
        btn.style.cssText = 'margin-top: 10px; background: var(--verde-principal); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer;';
        btn.addEventListener('click', async function () {
            const resposta = textarea.value.trim();
            if (!resposta) return;

            btn.disabled = true;
            btn.textContent = 'Salvando...';
            const { error: erroUpdate } = await supabaseClient
                .from('perguntas')
                .update({ resposta: resposta, respondido_em: new Date().toISOString() })
                .eq('id', item.id);

            if (erroUpdate) {
                alert('Erro ao salvar resposta: ' + erroUpdate.message);
                btn.disabled = false;
                btn.textContent = 'Salvar resposta';
                return;
            }
            await carregarPerguntas();
        });

        card.appendChild(textarea);
        card.appendChild(btn);
        lista.appendChild(card);
    });
}
