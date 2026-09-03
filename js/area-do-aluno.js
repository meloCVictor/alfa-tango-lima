const WHATSAPP_NUMERO_PADRAO = '5549999191709';
let sessaoAtual = null;

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
    sessaoAtual = session;

    document.getElementById('btn-sair').addEventListener('click', async function () {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });

    const { data: perfil } = await supabaseClient
        .from('profiles')
        .select('nome')
        .eq('id', session.user.id)
        .single();

    const nomeEl = document.getElementById('nome-usuario-logado');
    if (nomeEl) nomeEl.textContent = perfil && perfil.nome ? perfil.nome : session.user.email;
    document.getElementById('saudacao').textContent = 'Olá, ' + (perfil && perfil.nome || 'aluno(a)') + '! Seus cursos:';

    document.getElementById('carregando').style.display = 'none';
    document.getElementById('catalogo').style.display = 'block';

    await carregarCatalogo();
});

// ===== Vitrine: todos os cursos, com o status de cada um para este aluno =====
async function carregarCatalogo() {
    const lista = document.getElementById('lista-cursos');
    lista.innerHTML = '<p style="color: var(--cinza-claro);">Carregando cursos...</p>';

    const { data: cursos, error: erroCursos } = await supabaseClient
        .from('cursos')
        .select('id, nome, valor, pix_chave, pix_nome, pix_cidade, whatsapp_numero')
        .order('id', { ascending: true });

    const { data: matriculas } = await supabaseClient
        .from('matriculas')
        .select('curso_id, liberado')
        .eq('aluno_id', sessaoAtual.user.id);

    if (erroCursos || !cursos || cursos.length === 0) {
        lista.innerHTML = '<p style="color: var(--cinza-claro);">Nenhum curso disponível no momento.</p>';
        return;
    }

    const matriculaPorCurso = {};
    (matriculas || []).forEach(function (m) { matriculaPorCurso[m.curso_id] = m; });

    lista.innerHTML = '';
    cursos.forEach(function (curso) {
        const matricula = matriculaPorCurso[curso.id];
        const card = document.createElement('div');
        card.className = 'card';

        let statusHtml = '';
        if (!matricula) {
            statusHtml = '<span style="color: var(--cinza-claro); font-weight: 700; font-size: 0.85rem;">🛒 Você ainda não tem esse curso</span>';
        } else if (!matricula.liberado) {
            statusHtml = '<span style="color: var(--vermelho-urgencia); font-weight: 700; font-size: 0.85rem;">⏳ Aguardando confirmação do pagamento</span>';
        } else {
            statusHtml = '<span style="color: #16a34a; font-weight: 700; font-size: 0.85rem;">✓ Acesso liberado</span>';
        }

        card.innerHTML =
            '<div class="curso-header" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 12px;">' +
                '<div>' +
                    '<h3 style="color: var(--verde-escuro); margin-bottom: 4px;">' + curso.nome + '</h3>' +
                    statusHtml +
                '</div>' +
                '<span class="curso-seta" style="font-size: 1.2rem; color: var(--verde-principal);">▾</span>' +
            '</div>' +
            '<div class="curso-conteudo" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--verde-claro);"></div>';

        const header = card.querySelector('.curso-header');
        const conteudo = card.querySelector('.curso-conteudo');
        let carregado = false;

        header.addEventListener('click', async function () {
            const abrindo = conteudo.style.display === 'none';
            conteudo.style.display = abrindo ? 'block' : 'none';
            card.querySelector('.curso-seta').textContent = abrindo ? '▴' : '▾';

            if (abrindo && !carregado) {
                carregado = true;
                if (!matricula) {
                    renderCompra(conteudo, curso);
                } else if (!matricula.liberado) {
                    renderAguardando(conteudo, curso);
                } else {
                    await renderModulos(conteudo, curso);
                }
            }
        });

        lista.appendChild(card);
    });
}

// ===== Curso que o aluno ainda não comprou =====
function renderCompra(container, curso) {
    if (!curso.valor || !curso.pix_chave) {
        container.innerHTML = '<p style="color: var(--cinza-claro);">Esse curso ainda não está disponível para compra por aqui. Entre em contato pelo WhatsApp.</p>';
        return;
    }

    container.innerHTML =
        '<p style="color: var(--cinza-claro); margin-bottom: 12px;">Garanta seu acesso por <strong>R$ ' + Number(curso.valor).toFixed(2).replace('.', ',') + '</strong> via PIX.</p>' +
        '<button type="button" class="btn-cta btn-comprar" style="font-size: 0.95rem; padding: 12px 24px;">GERAR PIX PARA ESSE CURSO →</button>';

    container.querySelector('.btn-comprar').addEventListener('click', async function (e) {
        const btn = e.target;
        btn.disabled = true;
        btn.textContent = 'PROCESSANDO...';

        const { error } = await supabaseClient
            .from('matriculas')
            .insert({ aluno_id: sessaoAtual.user.id, curso_id: curso.id });

        if (error) {
            alert('Erro ao criar a matrícula: ' + error.message);
            btn.disabled = false;
            btn.textContent = 'GERAR PIX PARA ESSE CURSO →';
            return;
        }

        abrirModalPix(curso);
        await carregarCatalogo();
    });
}

// ===== Curso já matriculado, aguardando liberação =====
function renderAguardando(container, curso) {
    const whatsappNumero = curso.whatsapp_numero || WHATSAPP_NUMERO_PADRAO;
    const msg = 'Olá! Já me inscrevi no curso ' + curso.nome + ' e quero enviar o comprovante do PIX.';

    container.innerHTML =
        '<p style="color: var(--cinza-claro); margin-bottom: 12px;">Estamos confirmando seu pagamento. Ainda não enviou o comprovante ou perdeu o código PIX?</p>' +
        '<div style="display: flex; gap: 10px; flex-wrap: wrap;">' +
            '<button type="button" class="btn-cta btn-ver-pix" style="font-size: 0.9rem; padding: 10px 20px;">Ver PIX novamente</button>' +
            '<a href="https://wa.me/' + whatsappNumero + '?text=' + encodeURIComponent(msg) + '" target="_blank" ' +
                'style="display: inline-block; background: #25D366; color: white; font-weight: 700; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 0.9rem;">📱 WhatsApp</a>' +
        '</div>';

    container.querySelector('.btn-ver-pix').addEventListener('click', function () {
        abrirModalPix(curso);
    });
}

// ===== Abre o modal de PIX para um curso (compra nova ou reenvio) =====
function abrirModalPix(curso) {
    const pixCode = gerarPixCopiaCola({
        chave: curso.pix_chave,
        nome: curso.pix_nome,
        cidade: curso.pix_cidade,
        valor: curso.valor
    });

    document.getElementById('titulo-modal-compra').textContent = 'Pague R$ ' + Number(curso.valor).toFixed(2).replace('.', ',') + ' via PIX';
    document.getElementById('pix-codigo-compra').textContent = pixCode;
    document.getElementById('qr-code-compra').src =
        'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(pixCode);

    const whatsappNumero = curso.whatsapp_numero || WHATSAPP_NUMERO_PADRAO;
    const msg = 'Olá! Acabei de me inscrever no curso ' + curso.nome + '. Vou enviar o comprovante do PIX:';
    document.getElementById('btn-whatsapp-compra').href = 'https://wa.me/' + whatsappNumero + '?text=' + encodeURIComponent(msg);

    document.getElementById('modal-pix-compra').style.display = 'flex';
}

function copiarPixCompra() {
    const codigo = document.getElementById('pix-codigo-compra').textContent;
    navigator.clipboard.writeText(codigo).then(function () {
        const btn = event.target;
        const texto = btn.textContent;
        btn.textContent = '✅ COPIADO!';
        setTimeout(function () { btn.textContent = texto; }, 2000);
    });
}

// ===== Curso liberado: lista os módulos (vídeo, PDF, fórum) =====
async function renderModulos(container, curso) {
    container.innerHTML = '<p style="color: var(--cinza-claro);">Carregando módulos...</p>';

    const { data: modulos, error: erroModulos } = await supabaseClient
        .from('modulos')
        .select('id, titulo, descricao, link, material_link')
        .eq('curso_id', curso.id)
        .order('ordem', { ascending: true });

    if (erroModulos || !modulos || modulos.length === 0) {
        container.innerHTML = '<p style="color: var(--cinza-claro);">Nenhum módulo disponível no momento. Volte em breve.</p>';
        return;
    }

    container.innerHTML = '';
    for (const modulo of modulos) {
        const embedUrl = driveEmbedUrl(modulo.link);
        const moduloEl = document.createElement('div');
        moduloEl.style.marginBottom = '24px';
        moduloEl.innerHTML =
            '<h4 style="color: var(--verde-escuro); margin-bottom: 6px;">' + modulo.titulo + '</h4>' +
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
        container.appendChild(moduloEl);

        await renderForum(moduloEl.querySelector('.forum-modulo'), modulo.id);
    }
}

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


