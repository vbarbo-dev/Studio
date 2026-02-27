import { admin, getFirebaseAdminApp } from '../_lib/firebaseAdmin.js';

export const config = { runtime: 'nodejs' };


const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Zyndo <contato@zyndo.com.br>';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, condoName, subdomain } = req.body || {};

  if (!email || !condoName || !subdomain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured' });
  }

  try {
    const { Resend } = await import('resend');
    getFirebaseAdminApp();
    const loginUrl = `https://${subdomain}.zyndo.com.br`;

    let passwordSetupLink: string;
    try {
      // Preferimos o domínio direto do condomínio para melhor UX.
      passwordSetupLink = await admin.auth().generatePasswordResetLink(email, {
        url: `${loginUrl}/login`,
      });
    } catch (error: any) {
      // Fallback para domínio raiz (único normalmente allowlisted no Firebase Auth).
      if (String(error?.message || '').includes('Domain not allowlisted')) {
        const passwordSetupUrl = new URL('https://zyndo.com.br/login');
        passwordSetupUrl.searchParams.set('next', subdomain);
        passwordSetupLink = await admin.auth().generatePasswordResetLink(email, {
          url: passwordSetupUrl.toString(),
        });
      } else {
        throw error;
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY as string);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Bem-vindo ao Zyndo - ${condoName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h1 style="color: #1e40af; margin:0 0 16px 0;">Parabéns! Seu condomínio está pronto.</h1>
          <p>O condomínio <strong>${condoName}</strong> foi cadastrado com sucesso.</p>
          <p>Para acessar imediatamente, defina sua senha agora no botão abaixo:</p>

          <p style="margin: 24px 0;">
            <a href="${passwordSetupLink}" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">Definir minha senha</a>
          </p>

          <p style="font-size: 14px; color: #64748b;">Este link é oficial do Firebase e expira automaticamente.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
          <p>Seu endereço exclusivo: <a href="${loginUrl}">${loginUrl}</a></p>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Onboarding email sent', data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
}
