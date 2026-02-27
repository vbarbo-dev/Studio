import express from 'express';
import { Resend } from 'resend';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';

// Initialize Firebase Admin
// Note: In a real production environment, you should use a service account key file
// or environment variables. For this environment, we assume the default credentials
// or a simplified setup if possible. 
if (!admin.apps.length) {
  admin.initializeApp({
    // If you have a service account, you'd put it here.
    // For now, we'll try to use the environment's default or just initialize.
  });
}

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Resend Configuration
const resend = new Resend('re_CsGcJzGS_2d3KnGzNqajVX37n6iAXwsUH');
const FROM_EMAIL = 'Zyndo <contato@zyndo.com.br>';

// Simple In-Memory Rate Limiter
const emailRateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 3;

const checkRateLimit = (email: string) => {
  const now = Date.now();
  const userData = emailRateLimit.get(email);

  if (userData && now - userData < RATE_LIMIT_WINDOW) {
    return false;
  }
  
  emailRateLimit.set(email, now);
  return true;
};

// API Routes
app.post('/api/send-recovery-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!checkRateLimit(email)) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde um minuto.' });
  }

  try {
    // 1. Gerar o link de reset via Firebase Admin
    // Isso gera o link oficial que o Firebase usaria, mas nos permite enviar via Resend
    const link = await admin.auth().generatePasswordResetLink(email, {
      url: 'https://zyndo.com.br/login', // URL para onde o usuário vai após resetar
    });

    // 2. Enviar via Resend com template customizado
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Redefinição de Senha - Zyndo',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">ZYNDO</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Gestão Inteligente de Condomínios</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 30px; rounded: 16px; border: 1px solid #e2e8f0;">
            <h2 style="margin-top: 0;">Olá!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no Zyndo.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="display: inline-block; background-color: #1e40af; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.2);">Redefinir Minha Senha</a>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">Se você não solicitou essa alteração, pode ignorar este e-mail com segurança. Sua senha atual permanecerá a mesma.</p>
            <p style="font-size: 14px; color: #64748b;">O link acima é válido por 1 hora.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8;">
            <p>© ${new Date().getFullYear()} Zyndo - Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Email sent successfully', data });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/saas/send-welcome-email', async (req, res) => {
  const { email, condoName, subdomain } = req.body;

  if (!email || !condoName || !subdomain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const loginUrl = `https://${subdomain}.zyndo.com.br`;
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Bem-vindo ao Zyndo - ${condoName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">ZYNDO</h1>
          </div>
          
          <div style="background-color: #f8fafc; padding: 30px; rounded: 16px; border: 1px solid #e2e8f0;">
            <h1 style="color: #1e40af; font-size: 24px; margin-top: 0;">Parabéns! Seu condomínio está pronto.</h1>
            <p>Olá,</p>
            <p>O condomínio <strong>${condoName}</strong> foi cadastrado com sucesso na plataforma Zyndo.</p>
            <p>Para começar a gerenciar seu condomínio, você precisa definir sua senha de acesso.</p>
            <p><strong>Enviamos um e-mail separado</strong> com o link oficial para você criar sua senha. Por favor, verifique sua caixa de entrada.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            
            <p><strong>Seu endereço de acesso exclusivo:</strong></p>
            <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
              <a href="${loginUrl}" style="font-size: 18px; color: #1e40af; font-weight: bold; text-decoration: none;">${loginUrl}</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #64748b;">Dica: Salve este endereço nos seus favoritos para facilitar o acesso diário.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8;">
            <p>Se tiver qualquer dúvida, responda a este e-mail.</p>
            <p>© ${new Date().getFullYear()} Zyndo - Feito para síndicos.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Welcome email sent', data });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vite Middleware (for development)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if needed)
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
