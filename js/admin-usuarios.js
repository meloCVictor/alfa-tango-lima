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

    document.getElementById('btn-exportar').addEventListener('click', exportarUsuariosCSV);
});

// ===== Exporta a lista atual de usuários para um arquivo CSV (abre direto no Excel) =====
function exportarUsuariosCSV() {
    const colunas = ['nome', 'email', 'telefone', 'cargo', 'is_admin', 'created_at'];
    const cabecalho = ['Nome', 'E-mail', 'Telefone', 'Cargo', 'Admin', 'Cadastrado em'];

    function escaparCsv(valor) {
        const texto = String(valor === null || valor === undefined ? '' : valor);
        return '"' + texto.replace(/"/g, '""') + '"';
    }

    const linhas = [cabecalho.map(escaparCsv).join(';')];
    usuarios.forEach(function (u) {
        linhas.push(colunas.map(function (col) { return escaparCsv(u[col]); }).join(';'));
    });

    // BOM no início para o Excel reconhecer acentuação em UTF-8
    const conteudo = '\uFEFF' + linhas.join('\r\n');
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios-curso-alvorada-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}

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
            '<div style="flex: 1;">' +
                '<strong style="color: var(--verde-escuro);">' + (usuario.nome || '(sem nome)') + '</strong>' + badgeAdmin + '<br>' +
                '<span style="font-size: 0.85rem; color: var(--cinza-claro);">' + usuario.email + ' · ' + (usuario.telefone || '-') + (usuario.cargo ? ' · ' + usuario.cargo : '') + '</span>' +
            '</div>';

        const acoes = document.createElement('div');
        acoes.style.cssText = 'display: flex; gap: 8px; flex-shrink: 0;';

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.textContent = 'Editar';
        btnEditar.style.cssText = 'padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; border: 1px solid var(--verde-principal); color: var(--verde-principal); background: white;';
        btnEditar.addEventListener('click', function () {
            abrirEdicao(card, usuario);
        });

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

        acoes.appendChild(btnEditar);
        acoes.appendChild(btn);
        card.appendChild(acoes);
        lista.appendChild(card);
    });
}

// ===== Edição inline de nome/telefone/cargo de um usuário =====
function abrirEdicao(card, usuario) {
    card.innerHTML =
        '<div style="width: 100%;">' +
            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">' +
                '<input type="text" class="form-input campo-nome" value="' + (usuario.nome || '').replace(/"/g, '&quot;') + '" placeholder="Nome">' +
                '<input type="tel" class="form-input campo-telefone" value="' + (usuario.telefone || '').replace(/"/g, '&quot;') + '" placeholder="Telefone">' +
                '<input type="text" class="form-input campo-cargo" value="' + (usuario.cargo || '').replace(/"/g, '&quot;') + '" placeholder="Cargo" style="grid-column: span 2;">' +
            '</div>' +
            '<p style="font-size: 0.8rem; color: var(--cinza-claro); margin-bottom: 12px;">E-mail (não editável aqui): ' + usuario.email + '</p>' +
            '<div style="display: flex; gap: 8px;">' +
                '<button type="button" class="btn-salvar-edicao" style="background: var(--verde-principal); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer;">Salvar</button>' +
                '<button type="button" class="btn-cancelar-edicao" style="background: none; border: 1px solid var(--cinza-claro); color: var(--cinza-claro); padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer;">Cancelar</button>' +
            '</div>' +
        '</div>';

    card.querySelector('.btn-cancelar-edicao').addEventListener('click', function () {
        renderUsuarios(document.getElementById('busca-usuario').value.trim().toLowerCase());
    });

    card.querySelector('.btn-salvar-edicao').addEventListener('click', async function () {
        const btnSalvar = this;
        const nome = card.querySelector('.campo-nome').value.trim();
        const telefone = card.querySelector('.campo-telefone').value.trim();
        const cargo = card.querySelector('.campo-cargo').value.trim();

        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        const { error } = await supabaseClient
            .from('profiles')
            .update({ nome: nome, telefone: telefone, cargo: cargo })
            .eq('id', usuario.id);

        if (error) {
            alert('Erro ao salvar: ' + error.message);
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar';
            return;
        }
        await carregarUsuarios();
    });
}
