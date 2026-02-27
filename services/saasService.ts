import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, updateProfile, UserCredential, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User, Condo } from '../types';

interface RegisterData {
    email: string;
    cpfCnpj: string;
    condoName: string;
    unitCount: number;
    subdomain: string;
}

// 0. Verificar disponibilidade de subdomínio
export const checkSubdomainAvailability = async (subdomain: string): Promise<boolean> => {
    if (!subdomain) return false;
    // Usamos uma coleção dedicada 'subdomain_registry' para evitar expor dados sensíveis da coleção 'condos'
    const docRef = doc(db, 'subdomain_registry', subdomain.toLowerCase());
    const docSnap = await getDoc(docRef);
    return !docSnap.exists();
};

// 1. Validação Pré-Cadastro
export const handlePreSignup = async (data: RegisterData) => {
    if (!data.email || !data.cpfCnpj || !data.condoName || !data.unitCount || !data.subdomain) {
        throw new Error("Dados incompletos.");
    }
    
    const isAvailable = await checkSubdomainAvailability(data.subdomain);
    if (!isAvailable) {
        throw new Error("Este subdomínio já está em uso. Escolha outro.");
    }

    return true;
};

// 2. Simulação de Pagamento
export const mockProcessPayment = async (planId: string): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Pagamento aprovado para o plano: ${planId}`);
            resolve(true);
        }, 1500);
    });
};

// 3. Criar Usuário no Auth
export const createAuthUser = async (email: string): Promise<UserCredential> => {
    // Gerar senha temporária forte para garantir criação
    const tempPassword = crypto.randomUUID() + "Aa1!"; 
    const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
    
    // Aguardar propagação do estado de autenticação
    await new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                unsubscribe();
                resolve();
            }
        });
    });

    return userCredential;
};

// 4. Criar Documento do Condomínio
export const createCondoDocument = async (data: RegisterData, userId: string) => {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");

    const newCondo: Condo = {
        id: data.subdomain.toLowerCase(),
        name: data.condoName,
        address: '',
        isActive: true,
        plan: 'pro',
        createdAt: new Date().toISOString(),
        unitCount: data.unitCount,
        cpfCnpj: data.cpfCnpj
    };

    await setDoc(doc(db, 'condos', newCondo.id), newCondo);
    
    // Registrar subdomínio na coleção pública de consulta
    await setDoc(doc(db, 'subdomain_registry', newCondo.id), {
        createdAt: new Date().toISOString(),
        condoName: data.condoName // Apenas nome, sem dados sensíveis
    });

    return newCondo;
};

// 5. Criar Documento do Usuário
export const createUserDocument = async (userCredential: UserCredential, condoId: string, data: RegisterData) => {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");

    const user = userCredential.user;
    
    await updateProfile(user, {
        displayName: 'Administrador'
    });

    const newUser: User = {
        id: user.uid,
        email: data.email,
        name: 'Administrador',
        role: 'syndic',
        condoId: condoId,
        apartment: 'ADM',
        block: 'ADM',
        phone: '',
        photoUrl: '',
        needsPasswordChange: true,
        createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', newUser.id), newUser);
    return newUser;
};

// Orquestrador Principal
export const createSaaSAccount = async (data: RegisterData) => {
    try {
        console.log("Iniciando cadastro SaaS...");

        // Passo 1: Validação (inclui check de subdomínio)
        await handlePreSignup(data);

        // Passo 2: Pagamento
        await mockProcessPayment('pro_plan');

        // Passo 3: Auth
        console.log("Criando usuário Auth...");
        const userCredential = await createAuthUser(data.email);
        
        if (!auth.currentUser) {
            throw new Error("Falha crítica: Usuário criado mas não autenticado.");
        }

        // Passo 4: Firestore - Condomínio
        console.log("Criando condomínio...");
        await createCondoDocument(data, userCredential.user.uid);

        // Passo 5: Firestore - Usuário
        console.log("Criando perfil de usuário...");
        await createUserDocument(userCredential, data.subdomain, data);

        // Passo 6: Email de Senha (Custom Resend Flow)
        console.log("Enviando emails via Resend...");
        try {
            // 1. Chamar nosso servidor para gerar o link e enviar via Resend
            // Isso substitui o sendPasswordResetEmail(auth, data.email) do Client SDK
            await fetch('/api/send-recovery-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email })
            });
            
            // 2. Enviar boas-vindas personalizado via Resend (Server API)
            await fetch('/api/saas/send-welcome-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: data.email, 
                    condoName: data.condoName,
                    subdomain: data.subdomain 
                })
            });
        } catch (emailError) {
            console.warn("Erro ao enviar emails:", emailError);
        }

        // Passo 7: Logout
        console.log("Finalizando...");
        await signOut(auth);

        return { success: true };

    } catch (error: any) {
        console.error("Erro no cadastro SaaS:", error);
        if (auth.currentUser) {
            await signOut(auth); 
        }
        throw error;
    }
};
