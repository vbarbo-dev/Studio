
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
    const loginUrl = `https://${subdomain}.zyndo.com.br`;

    const resend = new Resend(process.env.RESEND_API_KEY as string);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Bem-vindo ao Zyndo - ${condoName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h1 style="color: #1e40af;">Parabéns! Seu condomínio está pronto.</h1>
          <p>O condomínio <strong>${condoName}</strong> foi cadastrado com sucesso.</p>
          <p>Para começar, defina sua senha pelo link enviado no e-mail de recuperação.</p>
          <p>Seu endereço exclusivo: <a href="${loginUrl}">${loginUrl}</a></p>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Welcome email sent', data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
}
