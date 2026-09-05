// ===== Configurações =====
const CONFIG = Object.assign({
    PIX_CHAVE: '+5549999191709', // chave PIX tipo telefone
    PIX_NOME: 'VICTOR COSTA MELO',
    PIX_CIDADE: 'ALVORADA',
    VALOR: 39.90,
    WHATSAPP_NUMERO: '5549999191709',
    CURSO_SLUG: 'alvorada', // precisa bater com o slug cadastrado na tabela public.cursos
    GOOGLE_SCRIPT_URL: '' // Deixe vazio até configurar o Google Sheets
}, window.PAGE_CONFIG || {});

// ===== Espera o DOM carregar =====
document.addEventListener('DOMContentLoaded', function() {

    // ===== Pega o formulário (é uma div, não <form>, e o botão é type="button") =====
    const form = document.getElementById('form-inscricao');
    const btn = document.getElementById('btn-submit');

    if (!form || !btn) {
        console.error('Formulário #form-inscricao ou botão #btn-submit não encontrado!');
        return;
    }

    // ===== Clique no botão de pagamento =====
    btn.addEventListener('click', async function(e) {
        e.preventDefault();

        console.log('Formulário submetido!'); // Debug

        // Pega os valores
        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const cargo = document.getElementById('cargo').value;
        const senha = document.getElementById('senha').value;

        // Validação simples
        if (!nome || !email || !telefone || !senha) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        if (senha.length < 6) {
            alert('A senha precisa ter no mínimo 6 caracteres.');
            return;
        }

        const dados = {
            nome: nome,
            email: email,
            telefone: telefone,
            cargo: cargo,
            valor: CONFIG.VALOR,
            data: new Date().toISOString()
        };

        // Desabilita o botão
        const textoOriginal = btn.textContent;
        btn.textContent = 'PROCESSANDO...';
        btn.disabled = true;

        // ===== Salva localmente (backup, funciona mesmo sem internet/backend) =====
        salvarLocal(dados);

        // ===== Cria a conta do aluno no Supabase e matricula no curso desta página =====
        let resultadoMatricula = { status: 'erro' };
        if (typeof supabaseClient !== 'undefined') {
            resultadoMatricula = await matricularAlunoNoCurso(email, senha, nome, telefone, cargo);
        }

        // Interrompe o fluxo se não conseguimos autenticar ou o aluno já tem acesso liberado
        if (resultadoMatricula.status === 'senha_invalida') {
            alert('Este e-mail já possui uma conta, mas a senha informada não confere.\n\nSe você já se cadastrou antes, use a tela de login em vez de preencher o formulário de novo.');
            btn.textContent = textoOriginal;
            btn.disabled = false;
            return;
        }
        if (resultadoMatricula.status === 'ja_liberado') {
            alert('Você já tem acesso liberado a este curso! Faça login para assistir às aulas.');
            window.location.href = 'login.html';
            return;
        }
        if (resultadoMatricula.status === 'erro') {
            alert('Não foi possível concluir o cadastro agora. Tente novamente ou fale com a gente no WhatsApp.');
            btn.textContent = textoOriginal;
            btn.disabled = false;
            return;
        }

        // ===== Salva no Netlify Forms (funciona quando publicado no Netlify) =====
        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                'form-name': 'inscricao',
                nome: dados.nome,
                email: dados.email,
                telefone: dados.telefone,
                cargo: dados.cargo,
                valor: String(dados.valor),
                data: dados.data
            }).toString()
        }).catch(function(err) {
            console.warn('Erro ao salvar no Netlify Forms (não crítico):', err);
        });

        // ===== Tenta salvar no Sheets (se configurado) =====
        if (CONFIG.GOOGLE_SCRIPT_URL) {
            fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            }).catch(function(err) {
                console.warn('Erro ao salvar no Sheets (não crítico):', err);
            });
        }

        // ===== Gera o PIX e abre o modal =====
        try {
            // Gera código PIX
            const pixCode = gerarPixCopiaCola({
                chave: CONFIG.PIX_CHAVE,
                nome: CONFIG.PIX_NOME,
                cidade: CONFIG.PIX_CIDADE,
                valor: CONFIG.VALOR
            });
            document.getElementById('pix-codigo').textContent = pixCode;

            // Gera QR Code
            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(pixCode);
            document.getElementById('qr-code').src = qrUrl;

            // Preenche resumo
            const mensagensStatus = {
                novo: '✅ Conta criada com sucesso!',
                login: '👋 Você já tinha uma conta com esse e-mail — login efetuado.',
                ja_matriculado: '⏳ Você já tinha se inscrito nesse curso. Segue o PIX novamente.'
            };
            const statusEl = document.getElementById('status-cadastro');
            if (statusEl) {
                statusEl.textContent = mensagensStatus[resultadoMatricula.status] || '';
            }
            document.getElementById('resumo-cadastro').textContent = 
                dados.nome + ' · ' + dados.email + ' · ' + dados.telefone;
            document.getElementById('email-confirmacao').textContent = dados.email;

            // Configura WhatsApp
            const msgWhats = 'Olá! Acabei de me inscrever no curso de Alvorada. Nome: ' + dados.nome + '. Vou enviar o comprovante do PIX:';
            const btnWhats = document.getElementById('btn-whatsapp');
            if (btnWhats) {
                btnWhats.href = 'https://wa.me/' + CONFIG.WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msgWhats);
            }

            // Abre o modal
            const modal = document.getElementById('modal-pix');
            modal.style.display = 'flex';

            console.log('Modal PIX aberto com sucesso!'); // Debug

        } catch (err) {
            console.error('Erro ao gerar PIX:', err);
            alert('Erro ao gerar o PIX. Por favor, tente novamente ou nos chame no WhatsApp.');
        }

        // Reabilita o botão
        btn.textContent = textoOriginal;
        btn.disabled = false;
    });

    // ===== Máscara de telefone =====
    const telInput = document.getElementById('telefone');
    if (telInput) {
        telInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length <= 11) {
                v = v.replace(/(\d{2})(\d)/, '($1) $2');
                if (v.length > 10) v = v.replace(/(\d{5})(\d)/, '$1-$2');
                else if (v.length > 6) v = v.replace(/(\d{4})(\d)/, '$1-$2');
            }
            e.target.value = v;
        });
    }
});

// ===== Cria/loga o aluno no Supabase e cria a matrícula (não liberada) no curso desta página =====
// Retorna { status: 'novo' | 'login' | 'ja_matriculado' | 'ja_liberado' | 'senha_invalida' | 'erro', curso }
async function matricularAlunoNoCurso(email, senha, nome, telefone, cargo) {
    let session = null;
    let status = 'novo';

    // 1. Verifica se o usuário já possui sessão ativa neste navegador
    const { data: { session: activeSession } } = await supabaseClient.auth.getSession();
    if (activeSession && activeSession.user && activeSession.user.email.toLowerCase() === email.toLowerCase()) {
        session = activeSession;
        status = 'login';
    } else {
        // 2. Tenta registrar novo usuário
        const signUpRes = await supabaseClient.auth.signUp({
            email: email,
            password: senha,
            options: { data: { nome: nome, telefone: telefone, cargo: cargo } }
        });

        if (!signUpRes.error && signUpRes.data && signUpRes.data.session) {
            session = signUpRes.data.session;
        } else {
            // Se o e-mail já existe no banco de dados, tenta autenticar (login) com a senha fornecida
            const isAlreadyUser = signUpRes.error && (
                signUpRes.error.message.toLowerCase().includes('already registered') ||
                signUpRes.error.message.toLowerCase().includes('already in use') ||
                signUpRes.error.message.toLowerCase().includes('already exists') ||
                signUpRes.error.message.toLowerCase().includes('cadastrado') ||
                signUpRes.error.status === 422 ||
                signUpRes.error.status === 400
            );

            if (isAlreadyUser || signUpRes.error) {
                const signInRes = await supabaseClient.auth.signInWithPassword({ email: email, password: senha });
                if (signInRes.error) {
                    console.warn('Senha incorreta para usuário existente:', signInRes.error.message);
                    return { status: 'senha_invalida' };
                }
                session = signInRes.data.session;
                status = 'login';
            } else {
                console.warn('Erro ao criar conta no Supabase:', signUpRes.error ? signUpRes.error.message : 'desconhecido');
                return { status: 'erro' };
            }
        }
    }

    if (!session || !session.user) return { status: 'erro' };

    // Registra início da sessão de 60 minutos
    if (typeof iniciarSessao === 'function') {
        iniciarSessao();
    }

    const { data: curso, error: erroCurso } = await supabaseClient
        .from('cursos')
        .select('id, nome')
        .eq('slug', CONFIG.CURSO_SLUG)
        .single();

    if (erroCurso || !curso) {
        console.warn('Curso não encontrado para o slug "' + CONFIG.CURSO_SLUG + '" (não crítico):', erroCurso);
        return { status: 'erro' };
    }

    // Verifica se já existe matrícula nesse curso antes de criar uma nova
    const { data: matriculaExistente } = await supabaseClient
        .from('matriculas')
        .select('liberado')
        .eq('aluno_id', session.user.id)
        .eq('curso_id', curso.id)
        .maybeSingle();

    if (matriculaExistente) {
        return { status: matriculaExistente.liberado ? 'ja_liberado' : 'ja_matriculado', curso: curso };
    }

    const { error: erroMatricula } = await supabaseClient
        .from('matriculas')
        .insert({ aluno_id: session.user.id, curso_id: curso.id });

    if (erroMatricula) {
        console.warn('Erro ao criar matrícula:', erroMatricula.message);
        return { status: 'erro' };
    }

    if (typeof enviarEmail === 'function') {
        enviarEmail(
            email,
            'Recebemos sua inscrição no ' + curso.nome,
            '<p>Olá, ' + nome + '!</p>' +
            '<p>Recebemos sua inscrição no <strong>' + curso.nome + '</strong>. Assim que confirmarmos o pagamento do PIX, ' +
            'seu acesso será liberado e você poderá entrar com o e-mail e a senha que você cadastrou.</p>' +
            '<p>Qualquer dúvida, é só chamar no WhatsApp.</p>'
        );
    }

    return { status: status, curso: curso };
}


// ===== Salva a inscrição no localStorage (backup local) =====
function salvarLocal(dados) {
    try {
        const lista = JSON.parse(localStorage.getItem('inscricoes_alvorada') || '[]');
        lista.push(dados);
        localStorage.setItem('inscricoes_alvorada', JSON.stringify(lista));
    } catch (err) {
        console.warn('Erro ao salvar localmente (não crítico):', err);
    }
}

// ===== Funções do modal (globais) =====
function fecharModalPix() {
    const modal = document.getElementById('modal-pix');
    if (modal) modal.style.display = 'none';
}
function copiarPix() {
    const codigo = document.getElementById('pix-codigo').textContent;
    navigator.clipboard.writeText(codigo).then(function() {
        const btn = event.target;
        const texto = btn.textContent;
        btn.textContent = '✅ COPIADO!';
        btn.style.background = '#22c55e';
        setTimeout(function() {
            btn.textContent = texto;
            btn.style.background = '';
        }, 2000);
    });
}
