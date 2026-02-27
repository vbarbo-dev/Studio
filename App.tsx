import React, { useState, useEffect, useRef } from 'react';
import { SquaresFour, Megaphone, CalendarCheck, Warning, Wallet, List, UserCircle, ShieldCheck, Users, SignOut, Bell, X, Gear, Moon, Sun, CheckCircle, FileText, DownloadSimple, ShareNetwork, PlusSquare, UserFocus, Package, ClockCounterClockwise, Camera, Minus, Plus, House } from '@phosphor-icons/react';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, setDoc, query, where, getDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { db, auth } from './services/firebase';
import { Dashboard } from './components/Dashboard';
import { Notices } from './components/Notices';
import { Reservations } from './components/Reservations';
import { Incidents } from './components/Incidents';
import { Accounts } from './components/Accounts';
import { Login } from './components/Login';
import { ResetPassword } from './components/ResetPassword';
import { ResidentsManager } from './components/ResidentsManager';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { InstallPWA } from './components/InstallPWA';
import { UnitsManager } from './components/UnitsManager';
import { Documents } from './components/Documents';
import { ConciergePanel } from './components/ConciergePanel';
import { MyVisitors } from './components/MyVisitors';
import { MyOrders } from './components/MyOrders';
import { AccessLog } from './components/AccessLog';
import { Notice, Reservation, Incident, Transaction, ViewState, User, CommonArea, CondoSettings, Reminder, Condo, CondoDocument, Visitor, Order, Unit } from './types';


const getSubdomain = () => {
    const host = window.location.hostname;
    
    if (host === 'zyndo.com.br' || host === 'www.zyndo.com.br') {
        return null;
    }

    if (host.includes('localhost')) {
         const parts = host.split('.');
         if (parts.length > 1 && parts[0] !== 'www') {
             return parts[0];
         }
         return null; 
    } 

    const parts = host.split('.');
    if (parts.length > 2) {
        if (parts[0] === 'www') return null;
        return parts[0];
    }
    return null;
};

// Initial Seed
const INITIAL_COMMON_AREAS: Omit<CommonArea, 'id' | 'condoId'>[] = [
    { name: 'Salão de Festas', openTime: '08:00', closeTime: '23:00', requiresApproval: true, maxDuration: 4 },
    { name: 'Churrasqueira', openTime: '10:00', closeTime: '22:00', requiresApproval: true, maxDuration: 3 },
    { name: 'Terraço', openTime: '06:00', closeTime: '22:00', requiresApproval: false, maxDuration: 2 }
];

function App() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subdomain] = useState(getSubdomain());
  
  // App State
  const [currentCondo, setCurrentCondo] = useState<Condo | null>(null);
  const [loadingCondo, setLoadingCondo] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [invalidCondo, setInvalidCondo] = useState(false);

  // PWA State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false); // iOS Instructions
  const [showFloatingInstall, setShowFloatingInstall] = useState(true);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Navigation State Logic
  const viewFromUrl = searchParams.get('view') as ViewState;
  const [currentView, setCurrentViewState] = useState<ViewState>(viewFromUrl || 'dashboard');

  const setCurrentView = (view: ViewState) => {
      setCurrentViewState(view);
      setSearchParams({ view });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // Track if user has opened notifications for the current batch
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('theme') === 'dark' || 
                 (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
      return false;
  });

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // App Data State
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [documents, setDocuments] = useState<CondoDocument[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  // Concierge Data
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Avatar Upload & Cropping State
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempAvatarImage, setTempAvatarImage] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // --- AUTHENTICATION & INITIALIZATION ---
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setAuthLoading(true);
          if (user) {
              try {
                  // Fetch user profile from Firestore
                  const userDoc = await getDoc(doc(db, 'users', user.uid));
                  if (userDoc.exists()) {
                      const userData = { id: userDoc.id, ...userDoc.data() } as User;
                      setCurrentUser(userData);

                      // If we have a subdomain, verify if user belongs to it
                      if (subdomain && subdomain !== 'admin' && userData.condoId !== subdomain && userData.role !== 'super_admin') {
                          showToast('Usuário não pertence a este condomínio.', 'error');
                          await signOut(auth);
                          setCurrentUser(null);
                      } else if (userData.condoId) {
                          // Fetch Condo Data
                          const condoDoc = await getDoc(doc(db, 'condos', userData.condoId));
                          if (condoDoc.exists()) {
                              setCurrentCondo({ id: condoDoc.id, ...condoDoc.data() } as Condo);
                          } else {
                              setInvalidCondo(true);
                          }
                      }
                  } else {
                      // User authenticated but no profile found with UID.
                      // Try to find by email (Legacy user migration)
                      const q = query(collection(db, 'users'), where('email', '==', user.email));
                      const querySnapshot = await getDocs(q);
                      
                      if (!querySnapshot.empty) {
                          const oldUserDoc = querySnapshot.docs[0];
                          const oldUserData = oldUserDoc.data();
                          
                          console.log("Migrating legacy user to Auth UID...");

                          // Migrate to new UID
                          await setDoc(doc(db, 'users', user.uid), {
                              ...oldUserData,
                              id: user.uid // Ensure ID inside doc matches UID
                          });
                          
                          // Delete old doc to prevent duplicates
                          await deleteDoc(doc(db, 'users', oldUserDoc.id));
                          
                          const migratedUser = { id: user.uid, ...oldUserData } as User;
                          setCurrentUser(migratedUser);

                          // Verify Condo Logic (duplicated from above, could be refactored but keeping inline for safety)
                          if (subdomain && subdomain !== 'admin' && migratedUser.condoId !== subdomain && migratedUser.role !== 'super_admin') {
                              showToast('Usuário não pertence a este condomínio.', 'error');
                              await signOut(auth);
                              setCurrentUser(null);
                          } else if (migratedUser.condoId) {
                              const condoDoc = await getDoc(doc(db, 'condos', migratedUser.condoId));
                              if (condoDoc.exists()) {
                                  setCurrentCondo({ id: condoDoc.id, ...condoDoc.data() } as Condo);
                              } else {
                                  setInvalidCondo(true);
                              }
                          }
                      } else {
                          // Silenciar log de erro durante o processo de cadastro SaaS
                          // para evitar confusão no console enquanto o perfil é criado.
                          if (window.location.pathname !== '/') {
                              console.warn("Perfil de usuário ainda não criado para:", user.email);
                          }
                          setCurrentUser(null);
                      }
                  }
              } catch (error) {
                  console.error("Error fetching user profile:", error);
                  setConnectionStatus('offline');
              }
          } else {
              setCurrentUser(null);
              setCurrentCondo(null);
          }
          setAuthLoading(false);
          setLoadingCondo(false);
      });

      return () => unsubscribe();
  }, [subdomain]);

  // Redirect Logic for Doorman
  useEffect(() => {
      if (currentUser?.role === 'doorman' && currentView !== 'concierge') {
          setCurrentView('concierge');
      }
  }, [currentUser, currentView]);

  // --- PWA LOGIC ---
  useEffect(() => {
      // Check if standalone
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(isStandaloneMode);

      if (isStandaloneMode || !subdomain) return;

      // Check iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      if (isIosDevice) setIsIOS(true);

      // Check Android/Desktop
      const handler = (e: any) => {
          e.preventDefault();
          setInstallPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [subdomain]);

  const handleInstallClick = () => {
      if (isIOS) {
          setShowInstallModal(true);
          // If on sidebar, close sidebar
          setIsSidebarOpen(false);
      } else if (installPrompt) {
          installPrompt.prompt();
          installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
              if (choiceResult.outcome === 'accepted') {
                  setInstallPrompt(null);
                  setShowFloatingInstall(false);
              }
          });
      }
  };

  // --- DATA SYNC ---
  useEffect(() => {
    if (!currentCondo) return;
    const getCondoQuery = (colName: string) => query(collection(db, colName), where('condoId', '==', currentCondo.id));

    const unsubUsers = onSnapshot(getCondoQuery('users'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(data);
        // Update local user if changes happen in background
        if (currentUser) {
            const updatedMe = data.find(u => u.id === currentUser.id);
            if(updatedMe) setCurrentUser(updatedMe);
        }
    }, () => setConnectionStatus('offline'));

    const unsubAreas = onSnapshot(getCondoQuery('areas'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommonArea));
        setAreas(data);
        if (snapshot.empty) {
            INITIAL_COMMON_AREAS.forEach(area => addDoc(collection(db, 'areas'), { ...area, condoId: currentCondo.id }));
        }
    });

    const unsubNotices = onSnapshot(getCondoQuery('notices'), (snap) => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice))));
    const unsubReservations = onSnapshot(getCondoQuery('reservations'), (snap) => setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reservation))));
    const unsubIncidents = onSnapshot(getCondoQuery('incidents'), (snap) => setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Incident))));
    const unsubTransactions = onSnapshot(getCondoQuery('transactions'), (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))));
    const unsubReminders = onSnapshot(getCondoQuery('reminders'), (snap) => setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reminder))));
    const unsubDocuments = onSnapshot(getCondoQuery('documents'), (snap) => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as CondoDocument))));
    const unsubUnits = onSnapshot(getCondoQuery('units'), (snap) => setUnits(snap.docs.map(d => ({ id: d.id, ...d.data() } as Unit))));
    const unsubVisitors = onSnapshot(getCondoQuery('visitors'), (snap) => setVisitors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor))));
    const unsubOrders = onSnapshot(getCondoQuery('orders'), (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))));
    
    const unsubCondoSettings = onSnapshot(doc(db, 'condos', currentCondo.id), (docSnap) => {
        if(docSnap.exists()) {
             setCurrentCondo({ id: docSnap.id, ...docSnap.data() } as Condo);
        }
    });

    return () => {
        unsubUsers(); unsubAreas(); unsubNotices(); unsubReservations(); unsubIncidents(); unsubTransactions(); unsubReminders(); unsubDocuments(); unsubCondoSettings(); unsubVisitors(); unsubOrders(); unsubUnits();
    };
  }, [currentCondo?.id]);

  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }, [isDarkMode]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogin = async (email: string, password: string) => {
      try {
          await signInWithEmailAndPassword(auth, email, password);
          return true;
      } catch (error: any) {
          console.error("Login failed:", error);
          throw error;
      }
  };

  const handleLogout = async () => {
      try {
          await signOut(auth);
          setCurrentUser(null);
          setCurrentCondo(null);
          setUsers([]);
          navigate('/');
      } catch (error) {
          console.error("Logout failed:", error);
      }
  };

  const handlePasswordChange = async (email: string, newPass: string) => {
      showToast('Funcionalidade migrada para Firebase Auth.', 'error');
  };

  const handleMarkAsViewed = () => {
      if (!currentUser) return;

      if (currentUser.role === 'syndic' || currentUser.role === 'super_admin') {
          const unviewedRes = reservations.filter(r => !r.viewedBySyndic);
          unviewedRes.forEach(r => updateDoc(doc(db, 'reservations', r.id), { viewedBySyndic: true }));
      } else {
          const myUpdatedRes = reservations.filter(r => r.residentId === currentUser.id && r.viewedByResident === false);
          myUpdatedRes.forEach(r => updateDoc(doc(db, 'reservations', r.id), { viewedByResident: true }));
      }
  };

  const getNotifications = () => {
      if (!currentUser) return [];

      const notifs = [];

      // 1. SYNDIC ALERTS
      if (currentUser.role === 'syndic' || currentUser.role === 'super_admin') {
          // Pending Reservations
          reservations.filter(r => !r.viewedBySyndic || r.status === 'pending').forEach(r => {
              notifs.push({
                  id: r.id,
                  type: 'reservation',
                  title: 'Reserva Pendente',
                  desc: `${r.areaName} - ${r.date} (Apto ${r.apartment})`,
                  link: 'reservations',
                  urgent: r.status === 'pending'
              });
          });
          // New Incidents
          incidents.filter(i => !i.approved).forEach(i => {
              notifs.push({
                  id: i.id,
                  type: 'incident',
                  title: 'Nova Ocorrência',
                  desc: i.title,
                  link: 'incidents',
                  urgent: true
              });
          });
      } 
      
      // 2. RESIDENT ALERTS
      if (currentUser.role === 'resident') {
          // Reservation Updates
          reservations.filter(r => r.residentId === currentUser.id && r.viewedByResident === false && r.status !== 'pending').forEach(r => {
              let desc = `Sua reserva de ${r.areaName} para ${r.date} foi atualizada.`;
              if (r.status === 'rejected' && r.rejectionReason) desc = `Cancelado: ${r.rejectionReason}`;
              notifs.push({
                  id: r.id,
                  type: 'reservation',
                  title: r.status === 'confirmed' ? 'Reserva Aprovada' : 'Reserva Rejeitada',
                  desc: desc,
                  link: 'reservations',
                  urgent: false
              });
          });

          // Order Arrivals (Pending Pickups)
          orders.filter(o => o.targetApartment === currentUser.apartment && o.status === 'pending').forEach(o => {
              notifs.push({
                  id: o.id,
                  type: 'order',
                  title: 'Nova Encomenda',
                  desc: `${o.description} aguardando retirada.`,
                  link: 'my_orders',
                  urgent: false
              });
          });

          // Visitor Arrivals (Inside)
          // Note: In a real app we'd have a 'viewed' flag for this notification. 
          // For now, we show active visitors as a "live" status in notifications.
          visitors.filter(v => v.targetApartment === currentUser.apartment && v.status === 'inside').forEach(v => {
              notifs.push({
                  id: v.id,
                  type: 'visitor',
                  title: 'Entrada Registrada',
                  desc: `${v.type === 'provider' ? 'Prestador' : 'Visitante'} ${v.name} entrou no condomínio.`,
                  link: 'my_visitors',
                  urgent: false
              });
          });
      }

      // 3. DOORMAN ALERTS
      if (currentUser.role === 'doorman') {
          // Pre-authorized visitors waiting
          visitors.filter(v => v.status === 'expected').forEach(v => {
              notifs.push({
                  id: v.id,
                  type: 'visitor',
                  title: 'Visita Autorizada',
                  desc: `${v.name} para Apto ${v.targetApartment}.`,
                  link: 'concierge',
                  urgent: false
              });
          });
      }

      return notifs;
  };

  const notifications = getNotifications();
  const notificationCount = notifications.length;

  // New Notification Logic
  useEffect(() => {
      if (notificationCount > 0) {
          setHasNewNotifications(true);
      }
  }, [notificationCount]);

  // --- AVATAR UPLOAD & CROP LOGIC ---
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 4 * 1024 * 1024) {
              showToast('Imagem muito grande. Máximo 4MB.', 'error');
              return;
          }
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              setTempAvatarImage(event.target?.result as string);
              setCropModalOpen(true);
              setCropScale(1);
              setCropPosition({x: 0, y: 0});
          };
      }
      // Reset input value to allow selecting same file again if needed
      if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setDragStart({ x: clientX - cropPosition.x, y: clientY - cropPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setCropPosition({
          x: clientX - dragStart.x,
          y: clientY - dragStart.y
      });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSaveCrop = async () => {
      if (!tempAvatarImage || !currentUser) return;

      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = tempAvatarImage;
      
      await new Promise(resolve => { img.onload = resolve; });

      // Calculate drawing props based on visible area in modal (assumed container 300x300 for calculation simplicity relative to output)
      // We apply the transforms (translate/scale) to the context
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 300, 300);

      // Center origin
      ctx.translate(150, 150);
      // Move by user pan
      ctx.translate(cropPosition.x, cropPosition.y);
      // Scale by user zoom
      ctx.scale(cropScale, cropScale);
      // Move image center to origin
      ctx.translate(-img.width / 2, -img.height / 2);

      ctx.drawImage(img, 0, 0);

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      
      await updateDoc(doc(db, 'users', currentUser.id), { photoUrl: croppedBase64 });
      showToast('Foto de perfil atualizada!');
      setCropModalOpen(false);
      setTempAvatarImage(null);
  };

  // Wrappers
  const handleAddNotice = async (n: Notice) => { const {id, ...d} = n; await addDoc(collection(db, 'notices'), {...d, condoId: currentCondo!.id}); showToast('Aviso publicado!'); };
  const handleUpdateNotice = async (id: string, u: Partial<Notice>) => { await updateDoc(doc(db, 'notices', id), u); showToast('Aviso atualizado!'); };
  const handleRemoveNotice = async (id: string) => { await deleteDoc(doc(db, 'notices', id)); showToast('Aviso removido.'); };
  const handleAddReservation = async (r: Reservation) => { const {id, ...d} = r; await addDoc(collection(db, 'reservations'), {...d, condoId: currentCondo!.id}); showToast(r.status === 'pending' ? 'Solicitação enviada!' : 'Reserva confirmada!'); };
  const handleUpdateReservation = async (id: string, u: Partial<Reservation>) => await updateDoc(doc(db, 'reservations', id), u);
  const handleRemoveReservation = async (id: string) => { await deleteDoc(doc(db, 'reservations', id)); showToast('Reserva cancelada.'); };
  const handleAddArea = async (a: CommonArea) => { const {id, ...d} = a; await addDoc(collection(db, 'areas'), {...d, condoId: currentCondo!.id}); showToast('Área adicionada.'); };
  const handleUpdateArea = async (id: string, u: Partial<CommonArea>) => { await updateDoc(doc(db, 'areas', id), u); showToast('Área atualizada.'); };
  const handleRemoveArea = async (id: string) => { await deleteDoc(doc(db, 'areas', id)); showToast('Área removida.'); };
  const handleAddIncident = async (i: Incident) => { const {id, ...d} = i; await addDoc(collection(db, 'incidents'), {...d, condoId: currentCondo!.id}); showToast(i.approved ? 'Ocorrência registrada.' : 'Enviado para análise.'); };
  const handleUpdateIncident = async (id: string, u: Partial<Incident>) => { await updateDoc(doc(db, 'incidents', id), u); showToast('Ocorrência atualizada.'); };
  const handleRemoveIncident = async (id: string) => { await deleteDoc(doc(db, 'incidents', id)); showToast('Ocorrência excluída.'); };
  const handleAddTransaction = async (t: Transaction) => { const {id, ...d} = t; await addDoc(collection(db, 'transactions'), {...d, condoId: currentCondo!.id}); showToast('Lançamento registrado.'); };
  const handleUpdateTransaction = async (id: string, u: Partial<Transaction>) => { await updateDoc(doc(db, 'transactions', id), u); showToast('Lançamento atualizado.'); };
  const handleRemoveTransaction = async (id: string) => { await deleteDoc(doc(db, 'transactions', id)); showToast('Lançamento removido.'); };
  const handleAddDocument = async (d: CondoDocument) => { const {id, ...rest} = d; await addDoc(collection(db, 'documents'), {...rest, condoId: currentCondo!.id}); showToast('Documento adicionado!'); };
  const handleRemoveDocument = async (id: string) => { await deleteDoc(doc(db, 'documents', id)); showToast('Documento removido.'); };
  const handleAddUser = async (u: User) => { 
    try {
      // 1. Criar no Auth via Servidor (para permitir login com CPF)
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: u.email, 
          password: u.password || u.cpf?.replace(/\D/g, '') || '123456',
          name: u.name
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar usuário no sistema de autenticação.');
      }
      
      const { uid } = await response.json();
      
      // 2. Criar no Firestore usando o UID do Auth
      const { id, password, ...d } = u; 
      await setDoc(doc(db, 'users', uid), {
        ...d, 
        id: uid,
        condoId: currentCondo!.id,
        createdAt: new Date().toISOString()
      });
      
      showToast('Usuário cadastrado e acesso liberado.'); 
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Erro ao cadastrar usuário.', 'error');
    }
  };
  const handleUpdateUser = async (id: string, u: Partial<User>) => { await updateDoc(doc(db, 'users', id), u); showToast('Dados atualizados.'); };
  const handleRemoveUser = async (id: string) => { await deleteDoc(doc(db, 'users', id)); showToast('Usuário removido.'); };
  const handleResetPassword = async (id: string) => { 
    const u = users.find(x => x.id === id); 
    if(u) { 
      try {
        const newPassword = u.cpf?.replace(/\D/g, '') || '123456';
        
        // 1. Atualizar no Auth via Servidor
        await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: u.email, 
            password: newPassword,
            name: u.name
          })
        });

        // 2. Atualizar no Firestore
        await updateDoc(doc(db, 'users', id), { 
          password: newPassword, 
          needsPasswordChange: true 
        }); 
        
        showToast('Senha resetada para o CPF.'); 
      } catch (error) {
        showToast('Erro ao resetar senha.', 'error');
      }
    }
  };
  const handleSaveSettings = async (s: CondoSettings) => { if(currentCondo) { await updateDoc(doc(db, 'condos', currentCondo.id), { name: s.name, address: s.address }); showToast('Configurações salvas.'); } };
  const addReminder = async (text: string) => { await addDoc(collection(db, 'reminders'), { text, completed: false, condoId: currentCondo!.id }); };
  const toggleReminder = async (id: string) => { const r = reminders.find(x => x.id === id); if(r) await updateDoc(doc(db, 'reminders', id), { completed: !r.completed }); };
  const deleteReminder = async (id: string) => { await deleteDoc(doc(db, 'reminders', id)); };
  
  // Concierge Wrappers
  const handleAddVisitor = async (v: Visitor) => { const {id, ...d} = v; await addDoc(collection(db, 'visitors'), {...d, condoId: currentCondo!.id}); };
  const handleUpdateVisitor = async (id: string, u: Partial<Visitor>) => { await updateDoc(doc(db, 'visitors', id), u); };
  const handleAddOrder = async (o: Order) => { const {id, ...d} = o; await addDoc(collection(db, 'orders'), {...d, condoId: currentCondo!.id}); };
  const handleUpdateOrder = async (id: string, u: Partial<Order>) => { await updateDoc(doc(db, 'orders', id), u); };

  const handleAddUnit = async (u: Unit) => { const {id, ...d} = u; await addDoc(collection(db, 'units'), {...d, condoId: currentCondo!.id}); showToast('Unidade criada.'); };
  const handleUpdateUnit = async (id: string, u: Partial<Unit>) => { await updateDoc(doc(db, 'units', id), u); };

  // --- RENDERING ---

  // Check for Reset Password Route
  const location = useLocation();
  if (location.pathname === '/reset-password') {
      return <ResetPassword />;
  }

  if (loadingCondo) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-slate-900">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
          </div>
      );
  }

  if (!subdomain) {
      return (
        <>
            <LandingPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            <InstallPWA show={false} onClick={() => {}} onDismiss={() => {}} /> {/* Do not show on LP */}
        </>
      );
  }

  if (subdomain === 'admin') {
      if (!currentUser || currentUser.role !== 'super_admin') {
          return <Login onLogin={handleLogin} onPasswordChange={() => {}} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
      }
      return <SuperAdminPanel onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  if (invalidCondo) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-[#F5F5F7] dark:bg-slate-900 text-center p-6">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full">
                  <div className="flex justify-center mb-4">
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full text-red-500">
                        <X size={48} />
                      </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Condomínio não encontrado</h1>
                  <p className="text-gray-500 dark:text-slate-400 mb-6">
                      O endereço <strong>{subdomain}.zyndo.com.br</strong> não está ativo ou não existe em nossa base.
                  </p>
                  <a href="/" className="bg-blue-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900 transition-colors inline-block">
                      Ir para Página Inicial
                  </a>
              </div>
          </div>
      );
  }

  if (!currentUser) {
      return (
        <>
            <Login onLogin={handleLogin} onPasswordChange={handlePasswordChange} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            {/* Show install prompt on Login if available */}
            {!isStandalone && (installPrompt || isIOS) && (
                <>
                    <InstallPWA show={showFloatingInstall} onClick={handleInstallClick} onDismiss={() => setShowFloatingInstall(false)} />
                    {showInstallModal && (
                        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 relative animate-fade-in-up mb-4 sm:mb-0">
                                <button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"><X size={20} /></button>
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Instalar no iPhone</h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">O iOS requer instalação manual. Siga os passos abaixo:</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-slate-600 text-blue-800 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0"><ShareNetwork size={24} weight="bold" /></div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-slate-200">1. Toque no botão <span className="font-bold">Compartilhar</span> na barra inferior do Safari.</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl flex items-center justify-center shrink-0"><PlusSquare size={24} weight="bold" /></div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-slate-200">2. Role para cima e selecione <span className="font-bold">Adicionar à Tela de Início</span>.</p>
                                    </div>
                                </div>
                                <div className="mt-6 text-center"><button onClick={() => setShowInstallModal(false)} className="text-blue-800 dark:text-blue-400 font-semibold text-sm hover:underline">Entendi</button></div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
      );
  }
  
  if (currentUser.condoId !== currentCondo?.id && currentUser.role !== 'super_admin') {
      return null;
  }

  // --- DASHBOARD LAYOUT ---
  const toggleSidebar = () => {
      if (window.innerWidth >= 1024) setIsSidebarCollapsed(!isSidebarCollapsed);
      else setIsSidebarOpen(true);
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: <SquaresFour size={20} /> },
    { id: 'notices', label: 'Avisos', icon: <Megaphone size={20} /> },
    { id: 'reservations', label: 'Reservas', icon: <CalendarCheck size={20} /> },
    { id: 'my_visitors', label: 'Visitantes', icon: <UserFocus size={20} /> },
    { id: 'my_orders', label: 'Encomendas', icon: <Package size={20} /> },
    { id: 'incidents', label: 'Ocorrências', icon: <Warning size={20} /> },
    { id: 'documents', label: 'Documentos', icon: <FileText size={20} /> },
    { id: 'accounts', label: 'Contas', icon: <Wallet size={20} /> },
  ];

  if (currentUser.role === 'syndic' || currentUser.role === 'super_admin') {
      navItems.push({ id: 'access_log', label: 'Histórico Portaria', icon: <ClockCounterClockwise size={20} /> });
      navItems.push({ id: 'units', label: 'Unidades', icon: <House size={20} /> });
      navItems.push({ id: 'residents', label: 'Usuários', icon: <Users size={20} /> });
      navItems.push({ id: 'settings', label: 'Configurações', icon: <Gear size={20} /> });
  }

  // Doorman has explicit simplified menu handled inside the sidebar render logic below, or we force it here:
  const doormanNavItems = [
      { id: 'concierge', label: 'Painel da Portaria', icon: <ShieldCheck size={20} /> },
  ];

  const activeNavItems = currentUser.role === 'doorman' ? doormanNavItems : navItems;

  const stats = {
      pendingIncidents: incidents.filter(i => i.status !== 'resolved' && i.approved).length,
      upcomingReservations: reservations.filter(r => r.status === 'confirmed' && new Date(r.date) >= new Date(new Date().setHours(0,0,0,0))).length,
      balance: transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0),
      activeNotices: notices.length
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] dark:bg-slate-900 overflow-hidden relative font-sans text-gray-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* CROP MODAL */}
      {cropModalOpen && tempAvatarImage && (
          <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up">
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 dark:text-white">Ajustar Foto</h3>
                      <button onClick={() => { setCropModalOpen(false); setTempAvatarImage(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="h-[300px] bg-black relative overflow-hidden cursor-move touch-none"
                       onMouseDown={handleMouseDown}
                       onMouseMove={handleMouseMove}
                       onMouseUp={handleMouseUp}
                       onMouseLeave={handleMouseUp}
                       onTouchStart={handleMouseDown}
                       onTouchMove={handleMouseMove}
                       onTouchEnd={handleMouseUp}
                  >
                      <img 
                        src={tempAvatarImage} 
                        alt="Crop Preview"
                        draggable={false}
                        className="max-w-none absolute top-1/2 left-1/2 select-none"
                        style={{
                            transform: `translate(-50%, -50%) translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropScale})`
                        }}
                      />
                      
                      {/* Circular Mask Overlay */}
                      <div className="absolute inset-0 pointer-events-none" 
                           style={{
                               background: 'radial-gradient(circle 150px at center, transparent 145px, rgba(0,0,0,0.7) 150px)'
                           }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-[300px] h-[300px] rounded-full border-2 border-white/50 border-dashed"></div>
                      </div>
                  </div>

                  <div className="p-6 space-y-6">
                      <div className="flex items-center gap-4">
                          <Minus size={20} className="text-gray-400"/>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="3" 
                            step="0.1" 
                            value={cropScale}
                            onChange={(e) => setCropScale(parseFloat(e.target.value))}
                            className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <Plus size={20} className="text-gray-400"/>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => { setCropModalOpen(false); setTempAvatarImage(null); }} className="flex-1 py-3 text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">Cancelar</button>
                          <button onClick={handleSaveCrop} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20">Salvar Foto</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* PWA Floating Button & Modals */}
      {!isStandalone && (installPrompt || isIOS) && (
          <>
            <InstallPWA show={showFloatingInstall} onClick={handleInstallClick} onDismiss={() => setShowFloatingInstall(false)} />
            {showInstallModal && (
                <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-700 relative animate-fade-in-up mb-4 sm:mb-0">
                        <button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"><X size={20} /></button>
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Instalar no iPhone</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">O iOS requer instalação manual. Siga os passos abaixo:</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-slate-600 text-blue-800 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0"><ShareNetwork size={24} weight="bold" /></div>
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">1. Toque no botão <span className="font-bold">Compartilhar</span> na barra inferior do Safari.</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl flex items-center justify-center shrink-0"><PlusSquare size={24} weight="bold" /></div>
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-200">2. Role para cima e selecione <span className="font-bold">Adicionar à Tela de Início</span>.</p>
                            </div>
                        </div>
                        <div className="mt-6 text-center"><button onClick={() => setShowInstallModal(false)} className="text-blue-800 dark:text-blue-400 font-semibold text-sm hover:underline">Entendi</button></div>
                    </div>
                </div>
            )}
          </>
      )}

      {/* Toast */}
      {toast && (
          <div className="fixed top-20 right-4 md:right-8 z-[100] animate-fade-in-down">
              <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 ${toast.type === 'success' ? 'bg-white dark:bg-slate-800 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400' : 'bg-white dark:bg-slate-800 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400'}`}>
                   {toast.type === 'success' ? <CheckCircle size={20} weight="fill" /> : <Warning size={20} weight="fill" />}
                   <p className="text-sm font-medium pr-2">{toast.message}</p>
                   <button onClick={() => setToast(null)}><X size={14} className="opacity-50 hover:opacity-100"/></button>
              </div>
          </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => { setShowNotifications(false); handleMarkAsViewed(); setHasNewNotifications(false); }}></div>
            <div className="absolute top-16 right-4 z-50 w-80 bg-white/90 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 animate-fade-in origin-top-right ring-1 ring-black/5">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center rounded-t-2xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell size={16} className="text-blue-800" weight="fill"/> Notificações
                    </h3>
                    <button onClick={() => { setShowNotifications(false); handleMarkAsViewed(); setHasNewNotifications(false); }}><X size={16} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"/></button>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notificationCount === 0 && <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">Nenhuma notificação nova.</div>}
                    {notifications.map((notif, idx) => (
                        <div 
                            key={`${notif.id}-${idx}`} 
                            onClick={() => { setCurrentView(notif.link as ViewState); setShowNotifications(false); handleMarkAsViewed(); setHasNewNotifications(false); }}
                            className="p-4 border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">{notif.title}</h4>
                                {notif.urgent && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{notif.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}

      {/* Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200/60 dark:border-slate-700/60 flex items-center px-4 justify-between z-40">
        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            {currentUser.role !== 'doorman' && (
                <button onClick={toggleSidebar} className="p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg transition-colors mr-1">
                    <List size={22} />
                </button>
            )}
            <div className="flex items-center gap-2">
                <span className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-500 font-['Bruno_Ace_SC'] tracking-wider">ZYNDO</span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-xs text-gray-500 dark:text-slate-300 font-mono">
                    {currentUser.role === 'doorman' ? 'Painel da Portaria' : currentCondo?.name}
                </span>
            </div>
        </div>
        <div className="flex items-center gap-2 relative">
            {currentUser.role === 'doorman' && (
                <button 
                    onClick={toggleTheme}
                    title="Alternar Tema"
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    {isDarkMode ? <Sun size={20} weight="fill" className="text-amber-400" /> : <Moon size={20} weight="fill" className="text-indigo-600" />}
                </button>
            )}
            <button onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) setHasNewNotifications(false); }} className="relative p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full transition-colors">
                <Bell size={22} weight={hasNewNotifications ? "fill" : "regular"} />
                {hasNewNotifications && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>}
            </button>
            {currentUser.role === 'doorman' && (
                 <button onClick={handleLogout} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-xs font-bold flex items-center gap-1">
                    <SignOut size={16} weight="bold" /> Sair
                </button>
            )}
        </div>
      </header>

      {/* Sidebar - HIDDEN FOR DOORMAN */}
      {currentUser.role !== 'doorman' && (
        <aside className={`
            fixed inset-y-0 left-0 z-50 lg:z-30 bg-white lg:bg-[#FBFBFD] dark:bg-slate-800 dark:lg:bg-slate-800/50 border-r border-gray-200/60 dark:border-slate-700/50 transform transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col
            lg:top-16 lg:bottom-0 lg:h-[calc(100vh-4rem)]
            ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
            ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 dark:border-slate-700/50 lg:hidden">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-800 dark:text-blue-500 font-['Bruno_Ace_SC'] tracking-wider">ZYNDO</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)}><X className="text-gray-500" /></button>
            </div>

            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                {activeNavItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => { setCurrentView(item.id as ViewState); setIsSidebarOpen(false); }}
                        title={isSidebarCollapsed ? item.label : ''}
                        className={`
                            w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                            ${currentView === item.id 
                                ? 'bg-white dark:bg-slate-700/50 text-blue-800 dark:text-blue-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-gray-100 dark:ring-slate-700' 
                                : 'text-gray-500 hover:bg-gray-100/60 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700/30 dark:hover:text-slate-200'}
                        `}
                    >
                        <div className={`flex items-center ${isSidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
                            <span className={currentView === item.id ? 'text-blue-800 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}>
                                {React.cloneElement(item.icon as any, { weight: currentView === item.id ? 'fill' : 'regular' })}
                            </span>
                            {!isSidebarCollapsed && item.label}
                        </div>
                    </button>
                ))}

                {/* Mobile Sidebar Install App Button */}
                {!isStandalone && (installPrompt || isIOS) && (
                    <button 
                        onClick={handleInstallClick}
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-blue-800 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 mt-6 lg:hidden`}
                    >
                        <div className={`flex items-center ${isSidebarCollapsed ? 'gap-0' : 'gap-3'}`}>
                            <DownloadSimple size={20} weight="bold" />
                            {!isSidebarCollapsed && "Instalar App"}
                        </div>
                    </button>
                )}
            </nav>

            <div className="p-4 border-t border-gray-100 dark:border-slate-700/50 lg:border-gray-200/30 bg-gray-50/30 dark:bg-slate-800/30">
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-4' : 'justify-between gap-2'} mb-4`}>
                    <div 
                        className="flex items-center gap-3 overflow-hidden cursor-pointer group"
                        onClick={() => avatarInputRef.current?.click()}
                        title="Alterar Foto"
                    >
                        <input 
                            type="file" 
                            ref={avatarInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-400 flex items-center justify-center font-semibold text-sm shrink-0 shadow-sm border border-gray-100 dark:border-slate-600 relative overflow-hidden group-hover:ring-2 group-hover:ring-blue-500/50 transition-all">
                            {currentUser.photoUrl ? (
                                <img src={currentUser.photoUrl} alt="Avatar" className="w-full h-full object-cover"/>
                            ) : getInitials(currentUser.name)}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={14} className="text-white"/>
                            </div>
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={currentUser.name}>{currentUser.name}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize truncate">
                                    {currentUser.role === 'syndic' ? 'Síndico' : currentUser.role === 'super_admin' ? 'Super Admin' : `Apto ${currentUser.apartment}`}
                                </p>
                            </div>
                        )}
                    </div>
                    <button onClick={handleLogout} className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-sm shadow-red-500/20 shrink-0" title="Sair do Sistema">
                        <SignOut size={16} weight="bold" />
                    </button>
                </div>
                
                <button 
                    onClick={toggleTheme}
                    title="Alternar Tema"
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 text-sm font-medium bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-800 dark:hover:text-blue-400 transition-all shadow-sm group`}
                >
                    {isDarkMode ? <Sun size={18} weight="fill" className="text-amber-400 group-hover:rotate-90 transition-transform" /> : <Moon size={18} weight="fill" className="text-indigo-600 group-hover:-rotate-12 transition-transform" />}
                    {!isSidebarCollapsed && <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
                </button>
            </div>
        </aside>
      )}

      <main className={`flex-1 flex flex-col h-screen overflow-hidden pt-16 transition-all duration-300 ${currentUser.role === 'doorman' ? 'lg:ml-0' : isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <div className={`flex-1 overflow-auto ${currentUser.role === 'doorman' ? 'p-0' : 'p-4 md:p-8'} flex flex-col`}>
            <div className={`max-w-6xl mx-auto animate-fade-in flex-1 w-full ${currentUser.role === 'doorman' ? 'max-w-full' : ''}`}>
                
                {currentView === 'dashboard' && (
                    <Dashboard 
                        changeView={setCurrentView} 
                        stats={stats} 
                        userRole={currentUser.role} 
                        condoSettings={currentCondo!}
                        reminders={reminders}
                        setReminders={(newReminders) => {
                            const added = newReminders.find(r => !reminders.find(old => old.id === r.id));
                            if (added) addReminder(added.text);
                            const removed = reminders.find(old => !newReminders.find(r => r.id === old.id));
                            if (removed) deleteReminder(removed.id);
                            const toggled = newReminders.find(r => {
                                const old = reminders.find(o => o.id === r.id);
                                return old && old.completed !== r.completed;
                            });
                            if (toggled) toggleReminder(toggled.id);
                        }}
                    />
                )}
                
                {currentView === 'notices' && (
                    <Notices 
                        notices={notices} 
                        addNotice={handleAddNotice}
                        updateNotice={handleUpdateNotice} 
                        removeNotice={handleRemoveNotice}
                        userRole={currentUser.role}
                    />
                )}
                
                {currentView === 'reservations' && (
                    <Reservations 
                        reservations={reservations}
                        areas={areas}
                        users={users}
                        addReservation={handleAddReservation}
                        updateReservation={handleUpdateReservation}
                        removeReservation={handleRemoveReservation}
                        addArea={handleAddArea}
                        updateArea={handleUpdateArea}
                        removeArea={handleRemoveArea}
                        currentUser={currentUser}
                        showToast={showToast}
                    />
                )}
                
                {currentView === 'incidents' && (
                    <Incidents 
                        incidents={incidents}
                        addIncident={handleAddIncident}
                        updateIncident={handleUpdateIncident}
                        removeIncident={handleRemoveIncident}
                        currentUser={currentUser}
                        showToast={showToast}
                    />
                )}
                
                {currentView === 'documents' && (
                    <Documents 
                        documents={documents}
                        addDocument={handleAddDocument}
                        removeDocument={handleRemoveDocument}
                        userRole={currentUser.role}
                        showToast={showToast}
                    />
                )}
                
                {currentView === 'accounts' && (
                    <Accounts 
                        transactions={transactions} 
                        addTransaction={handleAddTransaction}
                        updateTransaction={handleUpdateTransaction}
                        removeTransaction={handleRemoveTransaction}
                        userRole={currentUser.role}
                    />
                )}

                {currentView === 'units' && (currentUser.role === 'syndic' || currentUser.role === 'super_admin') && (
                    <UnitsManager 
                        units={units} 
                        users={users} 
                        condo={currentCondo!} 
                        addUnit={handleAddUnit} 
                        updateUnit={handleUpdateUnit} 
                        showToast={showToast} 
                    />
                )}

                {currentView === 'residents' && (currentUser.role === 'syndic' || currentUser.role === 'super_admin') && (
                    <ResidentsManager 
                        users={users}
                        units={units}
                        addUser={handleAddUser}
                        updateUser={handleUpdateUser}
                        removeUser={handleRemoveUser}
                        resetPassword={handleResetPassword}
                        showToast={showToast}
                    />
                )}

                {currentView === 'settings' && (currentUser.role === 'syndic' || currentUser.role === 'super_admin') && (
                    <Settings 
                        settings={currentCondo!}
                        onSave={handleSaveSettings}
                    />
                )}

                {currentView === 'concierge' && (
                    <ConciergePanel 
                        visitors={visitors}
                        orders={orders}
                        users={users}
                        units={units}
                        addVisitor={handleAddVisitor}
                        updateVisitor={handleUpdateVisitor}
                        addOrder={handleAddOrder}
                        updateOrder={handleUpdateOrder}
                        showToast={showToast}
                    />
                )}

                {currentView === 'my_visitors' && (
                    <MyVisitors 
                        visitors={visitors}
                        currentUser={currentUser}
                        addVisitor={handleAddVisitor}
                        showToast={showToast}
                    />
                )}

                {currentView === 'my_orders' && (
                    <MyOrders 
                        orders={orders}
                        currentUser={currentUser}
                    />
                )}

                {currentView === 'access_log' && (currentUser.role === 'syndic' || currentUser.role === 'super_admin') && (
                    <AccessLog 
                        visitors={visitors}
                        orders={orders}
                    />
                )}
            </div>
            {currentUser.role !== 'doorman' && (
                <footer className="mt-8 text-right text-xs text-gray-400 dark:text-slate-600 font-medium py-4 flex justify-end items-center gap-2">
                    <span>v2.1.0 (Multi-Tenant)</span>
                    <div 
                        title={connectionStatus === 'online' ? 'Sistema Online' : 'Conexão Instável/Offline'} 
                        className={`w-2 h-2 rounded-full transition-colors duration-500 ${connectionStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'}`}
                    ></div>
                </footer>
            )}
        </div>
      </main>
    </div>
  );
}

export default App;