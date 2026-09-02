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

    await carregarCursos();
    await carregarAlunos();

    document.getElementById('filtro-curso').addEventListener('change', carregarAlunos);
});

async function carregarCursos() {
    const select = document.getElementById('filtro-curso');
    const { data: cursos, error } = await supabaseClient
        .from('cursos')
        .select('id, nome')
        .order('nome', { ascending: true });

    if (error || !cursos) return;

    cursos.forEach(function (curso) {
        const option = document.createElement('option');
        option.value = curso.id;
        option.textContent = curso.nome;
        select.appendChild(option);
    });
}

async function carregarAlunos() {
    const lista = document.getElementById('lista-alunos');
    lista.innerHTML = '<p style="color: var(--cinza-claro);">Carregando alunos...</p>';

    const cursoId = document.getElementById('filtro-curso').value;

    let query = supabaseClient
        .from('matriculas')
        .select('id, liberado, created_at, profiles(nome, email, telefone, cargo), cursos(nome)')
        .order('created_at', { ascending: false });

    if (cursoId) {
        query = query.eq('curso_id', cursoId);
    }

    const { data: matriculas, error } = await query;

    if (error) {
        lista.innerHTML = '<p style="color: var(--vermelho-urgencia);">Erro ao carregar alunos: ' + error.message + '</p>';
        return;
    }

    if (!matriculas || matriculas.length === 0) {
        lista.innerHTML = '<p style="color: var(--cinza-claro);">Nenhum aluno matriculado ainda.</p>';
        return;
    }

    lista.innerHTML = '';
    matriculas.forEach(function (matricula) {
        const aluno = matricula.profiles || {};
        const curso = matricula.cursos || {};

        const card = document.createElement('div');
        card.className = 'card';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        card.style.gap = '16px';

        const status = matricula.liberado
            ? '<span style="color: #16a34a; font-weight: 700;">✓ Liberado</span>'
            : '<span style="color: var(--vermelho-urgencia); font-weight: 700;">Aguardando pagamento</span>';

        card.innerHTML =
            '<div>' +
                '<strong style="color: var(--verde-escuro);">' + (aluno.nome || '(sem nome)') + '</strong> ' +
                '<span style="font-size: 0.8rem; background: var(--verde-claro); color: var(--verde-principal); padding: 2px 8px; border-radius: 50px;">' + (curso.nome || '-') + '</span><br>' +
                '<span style="font-size: 0.85rem; color: var(--cinza-claro);">' + aluno.email + ' · ' + (aluno.telefone || '-') + '</span><br>' +
                '<span style="font-size: 0.8rem;">' + status + '</span>' +
            '</div>';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = matricula.liberado ? 'Revogar acesso' : 'Liberar acesso';
        btn.style.cssText = 'padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; color: white; flex-shrink: 0; background: ' +
            (matricula.liberado ? 'var(--vermelho-urgencia)' : 'var(--verde-principal)') + ';';
        btn.addEventListener('click', async function () {
            const vaiLiberar = !matricula.liberado;
            btn.disabled = true;
            btn.textContent = 'Salvando...';
            const { error: erroUpdate } = await supabaseClient
                .from('matriculas')
                .update({ liberado: vaiLiberar })
                .eq('id', matricula.id);

            if (erroUpdate) {
                alert('Erro ao atualizar: ' + erroUpdate.message);
                btn.disabled = false;
                btn.textContent = matricula.liberado ? 'Revogar acesso' : 'Liberar acesso';
                return;
            }

            if (vaiLiberar && aluno.email && typeof enviarEmail === 'function') {
                enviarEmail(
                    aluno.email,
                    'Seu acesso ao ' + (curso.nome || 'curso') + ' foi liberado!',
                    '<p>Olá, ' + (aluno.nome || 'aluno(a)') + '!</p>' +
                    '<p>Seu pagamento foi confirmado e o acesso ao <strong>' + (curso.nome || 'curso') + '</strong> já está liberado.</p>' +
                    '<p>Entre com o e-mail e a senha que você cadastrou em: ' +
                    '<a href="https://oprofvictor.netlify.app/login.html">https://oprofvictor.netlify.app/login.html</a></p>'
                );
            }

            await carregarAlunos();
        });

        card.appendChild(btn);
        lista.appendChild(card);
    });
}
