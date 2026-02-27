import admin from 'firebase-admin';

const getPrivateKey = () => {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
};

const getMissingEnvVars = () => {
  const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  return required.filter((name) => !process.env[name]);
};

export const getFirebaseAdminApp = () => {
  if (admin.apps.length) return admin.app();

  const missing = getMissingEnvVars();
  if (missing.length) {
    throw new Error(`Firebase Admin não configurado. Variáveis ausentes: ${missing.join(', ')}`);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID as string;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL as string;
  const privateKey = getPrivateKey() as string;

  // Ajuda bibliotecas Google no ambiente serverless a resolverem o project id
  process.env.GOOGLE_CLOUD_PROJECT = projectId;
  process.env.GCLOUD_PROJECT = projectId;

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
};

export { admin };
