import { admin, getFirebaseAdminApp } from './_lib/firebaseAdmin.js';

export const config = { runtime: 'nodejs' };


const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Zyndo <contato@zyndo.com.br>';

const emailRateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000;

const checkRateLimit = (email: string) => {
  const now = Date.now();
  const lastSentAt = emailRateLimit.get(email);
  if (lastSentAt && now - lastSentAt < RATE_LIMIT_WINDOW) return false;
  emailRateLimit.set(email, now);
  return true;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured' });
  }

  if (!checkRateLimit(email)) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde um minuto.' });
  }

  try {
    const { Resend } = await import('resend');
    getFirebaseAdminApp();
    const link = await admin.auth().generatePasswordResetLink(email, {
      // URL de retorno deve estar na allowlist do Firebase Auth
      url: 'https://zyndo.com.br/login',
    });

    const resend = new Resend(process.env.RESEND_API_KEY as string);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Redefinição de Senha - Zyndo',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h1 style="color: #1e40af;">ZYNDO</h1>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p><a href="${link}" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;">Redefinir Minha Senha</a></p>
          <p style="font-size: 12px; color: #64748b;">Se você não solicitou essa alteração, ignore este e-mail.</p>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Email sent successfully', data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
}
