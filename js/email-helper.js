// Helper compartilhado para disparar e-mails transacionais via Netlify Function + Resend
async function enviarEmail(to, subject, html) {
    try {
        await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: to, subject: subject, html: html })
        });
    } catch (err) {
        console.warn('Erro ao enviar e-mail (não crítico):', err);
    }
}
