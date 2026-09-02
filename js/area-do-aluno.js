const WHATSAPP_NUMERO = '5549999191709';

// Converte um link do Google Drive (view/share) para o formato de embed em iframe
function driveEmbedUrl(link) {
    const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/) || link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = match ? match[1] : null;
    return id ? 'https://drive.google.com/file/d/' + id + '/preview' : null;
}

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

    const { data: perfil } = await supabaseClient
        .from('profiles')
        .select('nome')
        .eq('id', session.user.id)
        .single();

    const { data: matriculas, error: erroMatriculas } = await supabaseClient
        .from('matriculas')
        .select('liberado, cursos(id, nome)')
        .eq('aluno_id', session.user.id);

    document.getElementById('carregando').style.display = 'none';

    if (erroMatriculas || !matriculas || matriculas.length === 0) {
        const msg = 'Olá! Fiz minha inscrição no curso de Alvorada e já quero enviar o comprovante do PIX.';
        document.getElementById('link-whatsapp-aguardando').href =
            'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg);
        document.getElementById('aguardando').style.display = 'block';
        return;
    }

    const liberadas = matriculas.filter(function (m) { return m.liberado && m.cursos; });

    if (liberadas.length === 0) {
        const msg = 'Olá! Fiz minha inscrição no curso de Alvorada e já quero enviar o comprovante do PIX.';
        document.getElementById('link-whatsapp-aguardando').href =
            'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg);
        document.getElementById('aguardando').style.display = 'block';
        return;
    }

    document.getElementById('saudacao').textContent = 'Bem-vindo(a), ' + (perfil && perfil.nome || 'aluno(a)') + '!';

    const lista = document.getElementById('lista-modulos');
    lista.innerHTML = '';

    for (const matricula of liberadas) {
        const cursoTitulo = document.createElement('h2');
        cursoTitulo.style.cssText = 'font-size: 1.2rem; color: var(--verde-principal); margin-top: 24px;';
        cursoTitulo.textContent = matricula.cursos.nome;
        lista.appendChild(cursoTitulo);

        const { data: modulos, error: erroModulos } = await supabaseClient
            .from('modulos')
            .select('id, titulo, descricao, link, material_link')
            .eq('curso_id', matricula.cursos.id)
            .order('ordem', { ascending: true });

        if (erroModulos || !modulos || modulos.length === 0) {
            const vazio = document.createElement('p');
            vazio.style.color = 'var(--cinza-claro)';
            vazio.textContent = 'Nenhum módulo disponível no momento. Volte em breve.';
            lista.appendChild(vazio);
            continue;
        }

        for (const modulo of modulos) {
            const embedUrl = driveEmbedUrl(modulo.link);
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML =
                '<h3 style="color: var(--verde-escuro); margin-bottom: 6px;">' + modulo.titulo + '</h3>' +
                (modulo.descricao ? '<p style="color: var(--cinza-claro); font-size: 0.9rem; margin-bottom: 12px;">' + modulo.descricao + '</p>' : '') +
                (embedUrl
                    ? '<div style="position: relative; padding-top: 56.25%; border-radius: 10px; overflow: hidden; background: #000;">' +
                        '<iframe src="' + embedUrl + '" allow="autoplay" allowfullscreen ' +
                        'style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"></iframe>' +
                      '</div>'
                    : '<a href="' + modulo.link + '" target="_blank" rel="noopener" class="btn-cta" style="font-size: 0.95rem; padding: 10px 24px;">ASSISTIR AULA →</a>') +
                (modulo.material_link
                    ? '<a href="' + modulo.material_link + '" target="_blank" rel="noopener" ' +
                        'style="display: inline-block; margin-top: 12px; color: var(--verde-principal); font-weight: 700; text-decoration: none; font-size: 0.9rem;">📄 Baixar material em PDF</a>'
                    : '') +
                '<div class="forum-modulo" data-modulo-id="' + modulo.id + '" ' +
                    'style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--verde-claro);"></div>';
            lista.appendChild(card);

            await renderForum(card.querySelector('.forum-modulo'), modulo.id);
        }
    }

    document.getElementById('liberado').style.display = 'block';
});

// ===== Fórum de perguntas de cada aula =====
async function renderForum(container, moduloId) {
    container.innerHTML =
        '<h4 style="font-size: 0.95rem; color: var(--verde-escuro); margin-bottom: 10px;">💬 Dúvidas sobre essa aula</h4>' +
        '<div class="forum-lista" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;"></div>' +
        '<div style="display: flex; gap: 8px;">' +
            '<input type="text" class="form-input forum-input" placeholder="Escreva sua pergunta..." style="flex: 1;">' +
            '<button type="button" class="forum-enviar" style="background: var(--verde-principal); color: white; border: none; padding: 0 20px; border-radius: 8px; font-weight: 700; cursor: pointer;">Enviar</button>' +
        '</div>';

    const listaEl = container.querySelector('.forum-lista');
    const inputEl = container.querySelector('.forum-input');
    const btnEl = container.querySelector('.forum-enviar');

    async function carregarPerguntas() {
        const { data: perguntas, error } = await supabaseClient
            .from('perguntas')
            .select('pergunta, resposta, created_at')
            .eq('modulo_id', moduloId)
            .order('created_at', { ascending: true });

        if (error) {
            listaEl.innerHTML = '<p style="color: var(--vermelho-urgencia); font-size: 0.85rem;">Erro ao carregar perguntas.</p>';
            return;
        }

        if (!perguntas || perguntas.length === 0) {
            listaEl.innerHTML = '<p style="color: var(--cinza-claro); font-size: 0.85rem;">Nenhuma pergunta ainda. Seja o primeiro a perguntar!</p>';
            return;
        }

        listaEl.innerHTML = perguntas.map(function (p) {
            return '<div style="background: var(--verde-bg); border-radius: 8px; padding: 10px 14px;">' +
                '<p style="font-size: 0.85rem; color: var(--cinza-texto);"><strong>Pergunta:</strong> ' + p.pergunta + '</p>' +
                (p.resposta
                    ? '<p style="font-size: 0.85rem; color: var(--verde-escuro); margin-top: 6px;"><strong>Resposta do professor:</strong> ' + p.resposta + '</p>'
                    : '<p style="font-size: 0.8rem; color: var(--cinza-claro); margin-top: 6px;">Aguardando resposta do professor...</p>') +
            '</div>';
        }).join('');
    }

    btnEl.addEventListener('click', async function () {
        const pergunta = inputEl.value.trim();
        if (!pergunta) return;

        btnEl.disabled = true;
        const { data: { session } } = await supabaseClient.auth.getSession();
        const { error } = await supabaseClient
            .from('perguntas')
            .insert({ modulo_id: moduloId, aluno_id: session.user.id, pergunta: pergunta });

        if (error) {
            alert('Erro ao enviar pergunta: ' + error.message);
        } else {
            inputEl.value = '';
            await carregarPerguntas();
        }
        btnEl.disabled = false;
    });

    await carregarPerguntas();
}


