import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MapPin,
  MessageCircle,
  Home,
  Key,
  ShieldCheck,
  DollarSign,
  Clock,
  User,
  Users,
  Smile,
  Award,
  Phone,
  Compass,
  BookOpen,
  Plus,
  Heart,
  Calculator,
  X,
  Send,
  Star,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Map,
  CheckCircle2,
  Info,
  Check,
  Lock,
  Mail,
  UserCheck,
  LogOut,
  ExternalLink,
  ImagePlus
} from "lucide-react";
import { HOUSING_LISTINGS, MACOT_TIPS, STUDENT_TESTIMONIALS } from "./data";
import { HousingListing, MascotTip } from "./types";

const makiMascot = "/src/assets/images/maki_hawk_guindo_plomo_1782934231251.jpg";
const makiMascot2 = "/src/assets/images/maki_hawk_mascot_1782932085847.jpg";
const unschEntranceImg = "/src/assets/images/toma-de-local-en-la-Unsch.webp";
const unschGateBg = "/src/assets/images/unsch_gate_bg_1782935844725.jpg";
const unschLogoIcon = "/src/assets/images/unsch_logo_icon_new_1782937711905.jpg";

const UNSCH_ACADEMIC_MAP: Record<string, string[]> = {
  "Facultad de Ingeniería de Minas, Geología y Metalurgia": [
    "Ingeniería de Sistemas",
    "Ingeniería de Minas",
    "Ingeniería Civil"
  ],
  "Facultad de Ingeniería Química y Metalurgia": [
    "Ingeniería Química",
    "Ingeniería en Industrias Alimentarias",
    "Ingeniería Agroindustrial"
  ],
  "Facultad de Ciencias de la Salud": [
    "Medicina Humana",
    "Enfermería",
    "Obstetricia"
  ],
  "Facultad de Ciencias Biológicas": [
    "Biología",
    "Farmacia y Bioquímica"
  ],
  "Facultad de Ciencias Agrarias": [
    "Agronomía",
    "Ingeniería Agrícola",
    "Medicina Veterinaria"
  ],
  "Facultad de Ciencias Sociales": [
    "Arqueología e Historia",
    "Trabajo Social",
    "Antropología Social",
    "Ciencias de la Comunicación"
  ],
  "Facultad de Ciencias de la Educación": [
    "Educación Inicial",
    "Educación Primaria",
    "Educación Secundaria",
    "Educación Física"
  ],
  "Facultad de Derecho y Ciencias Políticas": [
    "Derecho"
  ],
  "Facultad de Ciencias Económicas, Administrativas y Contables": [
    "Administración de Empresas",
    "Contabilidad",
    "Economía"
  ]
};

interface UserAccount {
  id?: string;
  name: string;
  email: string;
  role: "student" | "landlord" | "admin";
  faculty?: string;
  career?: string;
  phone?: string;
  isVerified?: boolean;
  verificationStatus?: "none" | "pending" | "approved" | "rejected";
  verificationDoc?: string;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: "u-1",
    name: "Rubén Mendoza",
    email: "ruben.mendoza@unsch.edu.pe",
    role: "student",
    faculty: "Facultad de Ingeniería de Minas, Geología y Metalurgia",
    career: "Ingeniería de Minas",
    phone: "966123456",
    isVerified: true,
    verificationStatus: "approved"
  },
  {
    id: "u-2",
    name: "Katherin Ccoyllo",
    email: "katherin.ccoyllo@unsch.edu.pe",
    role: "student",
    faculty: "Facultad de Ciencias de la Educación",
    career: "Educación Inicial",
    phone: "984765432",
    isVerified: true,
    verificationStatus: "approved"
  },
  {
    id: "u-3",
    name: "Sra. Teodora Quispe",
    email: "teodora.quispe@gmail.com",
    role: "landlord",
    phone: "966123456",
    isVerified: true,
    verificationStatus: "approved"
  },
  {
    id: "u-4",
    name: "Don Valerio Huamán",
    email: "valerio.huaman@gmail.com",
    role: "landlord",
    phone: "984765432",
    isVerified: true,
    verificationStatus: "approved"
  },
  {
    id: "u-5",
    name: "Gerson Vílchez",
    email: "gerson.vilchez@unsch.edu.pe",
    role: "student",
    faculty: "Facultad de Ingeniería de Minas, Geología y Metalurgia",
    career: "Ingeniería de Sistemas",
    phone: "912345678",
    isVerified: false,
    verificationStatus: "pending",
    verificationDoc: "CARNET_UNSCH_2026_GERSON.jpg"
  },
  {
    id: "u-6",
    name: "Sra. Julia Palomino",
    email: "julia.palomino@outlook.com",
    role: "landlord",
    phone: "961456789",
    isVerified: false,
    verificationStatus: "none"
  },
  {
    id: "u-7",
    name: "Sra. María Palomino",
    email: "maria.palomino@gmail.com",
    role: "landlord",
    phone: "999111222",
    isVerified: false,
    verificationStatus: "pending",
    verificationDoc: "TITULO_PROPIEDAD_Y_DNI.pdf"
  }
];

export default function App() {
  // Current active main view: "explore" or "dashboard"
  const [activeMainTab, setActiveMainTab] = useState<"explore" | "dashboard">("explore");

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const cached = localStorage.getItem("yachakuqwasi_user");
    return cached ? JSON.parse(cached) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<"student" | "landlord" | "admin">("student");
  const [authFaculty, setAuthFaculty] = useState("Facultad de Ingeniería de Minas, Geología y Metalurgia");
  const [authCareer, setAuthCareer] = useState("Ingeniería de Sistemas");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");

  // Administrators Management Data states
  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    const cached = localStorage.getItem("yachakuqwasi_users_list");
    return cached ? JSON.parse(cached) : INITIAL_USERS;
  });

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const logs = [
      { id: "log-1", user: "Maki Consejero", action: "Verificación automática", details: "Publicación 'Habitación Amoblada San Blas' verificada de forma automática.", timestamp: "Hace 10 minutos", type: "system" },
      { id: "log-2", user: "Admin (Steve)", action: "Aprobación de cuenta", details: "Se aprobó la credencial estudiantil de Katherin Ccoyllo.", timestamp: "Hace 1 hora", type: "user" },
      { id: "log-3", user: "Sra. Teodora Quispe", action: "Registro de anuncio", details: "Publicó una nueva oferta de habitación en Jr. Tres Máscaras.", timestamp: "Hace 2 horas", type: "listing" },
    ];
    return logs;
  });

  // Identity verification submissions state (re-synced with usersList)
  const verificationRequests = usersList.filter(u => u.verificationStatus === "pending");

  // Admin Active Sub-Tab
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<"verifications" | "listings" | "users" | "logs">("verifications");

  // Direct chat threads for students / landlords
  const [chatsList, setChatsList] = useState<any[]>(() => {
    const cached = localStorage.getItem("yachakuqwasi_chats");
    if (cached) return JSON.parse(cached);
    
    return [
      {
        id: "chat-1",
        landlordName: "Sra. Teodora Quispe",
        landlordEmail: "teodora.quispe@gmail.com",
        landlordAvatar: makiMascot,
        listingTitle: "Habitación Amoblada San Blas - Ideal UNSCH",
        lastMessage: "¡Allillanchu wawa! Sí, el cuarto sigue libre. Puedes venir a verlo hoy a las 4 PM si gustas.",
        messages: [
          { sender: "student", text: "¡Allillanchu Sra. Teodora! Estoy muy interesado en su habitación en San Blas. ¿Aún está disponible para este ciclo?", time: "10:30 AM" },
          { sender: "landlord", text: "¡Allillanchu wawa! Sí, el cuarto sigue libre. Puedes venir a verlo hoy a las 4 PM si gustas.", time: "10:35 AM" }
        ],
        unread: true,
        status: "online"
      },
      {
        id: "chat-2",
        landlordName: "Don Valerio Huamán",
        landlordEmail: "valerio.huaman@gmail.com",
        landlordAvatar: makiMascot2,
        listingTitle: "Minidepartamento Independiente cerca de Av. Independencia",
        lastMessage: "Listo Rubén, ya coordinamos. Te espero mañana en Jr. Los Diamantes.",
        messages: [
          { sender: "student", text: "Buenas tardes Don Valerio, ¿el precio incluye el Wi-Fi de alta velocidad para mis clases de sistemas?", time: "Ayer" },
          { sender: "landlord", text: "Sí, claro, es fibra óptica ideal para tus trabajos de la universidad.", time: "Ayer" },
          { sender: "student", text: "¡Excelente! ¿Cuándo podría ir a visitarlo?", time: "Ayer" },
          { sender: "landlord", text: "Listo Rubén, ya coordinamos. Te espero mañana en Jr. Los Diamantes.", time: "Ayer" }
        ],
        unread: false,
        status: "offline"
      }
    ];
  });
  const [activeChatId, setActiveChatId] = useState<string>("chat-1");
  const [activeChatMessageInput, setActiveChatMessageInput] = useState("");

  // Student specific verification flow state
  const [uploadedDocName, setUploadedDocName] = useState("");
  const [studentVerificationProgress, setStudentVerificationProgress] = useState<"none" | "uploading" | "submitted" | "approved">("none");

  // Save admin data helper
  const updateUsersAndPersist = (newUsers: UserAccount[]) => {
    setUsersList(newUsers);
    localStorage.setItem("yachakuqwasi_users_list", JSON.stringify(newUsers));
  };

  // Save chats helper
  const updateChatsAndPersist = (newChats: any[]) => {
    setChatsList(newChats);
    localStorage.setItem("yachakuqwasi_chats", JSON.stringify(newChats));
  };

  // Listings & Filtering state
  const [listings, setListings] = useState<HousingListing[]>(() => {
    const cached = localStorage.getItem("yachakuqwasi_listings");
    if (cached) return JSON.parse(cached);
    return HOUSING_LISTINGS.map(l => ({ ...l, status: "approved" }));
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(550);
  const [maxMinutes, setMaxMinutes] = useState<number>(15);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Selected Listing Detail Modal
  const [selectedListing, setSelectedListing] = useState<HousingListing | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Landlord Room Submit Form Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    title: "",
    type: "room" as const,
    pricePen: 250,
    distanceToUnschMinutes: 8,
    neighborhood: "San Blas",
    address: "",
    description: "",
    amenities: [] as string[],
    contactPhone: "",
    landlordName: "",
    images: [] as string[],
  });
  const [amenityInput, setAmenityInput] = useState("");
  const MAX_LISTING_PHOTOS = 8;

  // Convierte las fotos seleccionadas (arrendador o admin) a data URLs para previsualizarlas
  const handleAddImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = MAX_LISTING_PHOTOS - newRoom.images.length;
    if (remainingSlots <= 0) {
      alert(`Ya alcanzaste el máximo de ${MAX_LISTING_PHOTOS} fotos por publicación.`);
      return;
    }

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setNewRoom(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setNewRoom(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  const [formSuccess, setFormSuccess] = useState(false);

  // Maki Chat Companion state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "maki"; text: string; time: string }>>([
    {
      sender: "maki",
      text: "¡Allillanchu, estimado estudiante! 🦉 Soy Maki, tu halcón consejero de YachakuqWasi (La Casa del Estudiante). Estoy vestido de guindo y plomo, listo para guiarte por los mejores barrios universitarios de Ayacucho. ¿En qué facultad estudias o cuál es tu presupuesto ideal?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isMakiTyping, setIsMakiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Budget Calculator state
  const [rentCost, setRentCost] = useState(250);
  const [foodCost, setFoodCost] = useState(180);
  const [transportCost, setTransportCost] = useState(30);
  const [studyCost, setStudyCost] = useState(40);
  const [totalBudget, setTotalBudget] = useState(500);

  // Active Tab for Right Side Bento Column: 'budget' | 'roommate'
  const [activeBentoTab, setActiveBentoTab] = useState<"budget" | "roommate">("budget");

  // Roommate Match Quiz states
  const [roommateQuizStep, setRoommateQuizStep] = useState(0); // 0: Intro, 1-4: Questions, 5: Result
  const [roommateAnswers, setRoommateAnswers] = useState<Record<string, string>>({
    study: "",
    schedule: "",
    order: "",
    social: ""
  });

  // Current active tip index
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  // Ref for horizontal scrolling container
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setTotalBudget(Number(rentCost) + Number(foodCost) + Number(transportCost) + Number(studyCost));
  }, [rentCost, foodCost, transportCost, studyCost]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isMakiTyping]);

  useEffect(() => {
    if (!currentUser && activeMainTab === "dashboard") {
      setActiveMainTab("explore");
    }
  }, [currentUser, activeMainTab]);

  // Reinicia la galeria de fotos cada vez que se abre una publicacion distinta
  useEffect(() => {
    setGalleryIndex(0);
  }, [selectedListing?.id]);

  // Handle scroll progress
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const totalScroll = scrollWidth - clientWidth;
      if (totalScroll > 0) {
        setScrollProgress((scrollLeft / totalScroll) * 100);
      }
    }
  };

  // Scroll function for slider
  const scrollSlider = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Auth Submit Action
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!authEmail || !authPassword) {
      setAuthError("Por favor, ingresa tu correo electrónico y contraseña.");
      return;
    }

    if (authMode === "signup") {
      if (!authName) {
        setAuthError("Por favor, ingresa tu nombre completo.");
        return;
      }
      const newAcc: UserAccount = {
        name: authName,
        email: authEmail,
        role: authRole,
        faculty: authRole === "student" ? authFaculty : undefined,
        career: authRole === "student" ? authCareer : undefined,
        phone: authPhone || undefined
      };
      setCurrentUser(newAcc);
      localStorage.setItem("yachakuqwasi_user", JSON.stringify(newAcc));
      setIsAuthModalOpen(false);
      
      // Personalize Maki message
      setChatMessages(prev => [
        ...prev,
        {
          sender: "maki",
          text: `¡Qué alegría tenerte registrado en YachakuqWasi, ${authName}! Como tu halcón consejero, cuidaré tu camino de estudio. ¡Comienza a explorar las habitaciones ahora mismo!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      // Simulate successful login based on email hint or precise credentials
      const emailLower = authEmail.toLowerCase().trim();
      const pwd = authPassword;

      // Validate precise credentials provided by user
      if (emailLower === "admin_demo@alquilerunsch.pe") {
        if (pwd !== "AdminDemo2026!") {
          setAuthError("Contraseña incorrecta para la cuenta de Administrador Demo.");
          return;
        }
      } else if (emailLower === "estudiante_demo@unsch.edu.pe") {
        if (pwd !== "EstudianteDemo2026!") {
          setAuthError("Contraseña incorrecta para la cuenta de Estudiante Demo.");
          return;
        }
      } else if (emailLower === "arrendador_demo@gmail.com") {
        if (pwd !== "ArrendadorDemo2026!") {
          setAuthError("Contraseña incorrecta para la cuenta de Arrendador Demo.");
          return;
        }
      }

      let role: "student" | "landlord" | "admin" = "student";
      let name = authEmail.split("@")[0].toUpperCase();
      let faculty = "Facultad de Ingeniería de Minas, Geología y Metalurgia";
      let career = "Ingeniería de Sistemas";
      let isVerified = true;
      let verificationStatus: "approved" | "pending" | "none" = "approved";

      if (emailLower === "admin_demo@alquilerunsch.pe" || emailLower.includes("admin")) {
        role = "admin";
        name = "Steve Ovalle (Admin)";
      } else if (emailLower === "arrendador_demo@gmail.com" || emailLower.includes("arrendador") || emailLower.includes("propietario") || emailLower.includes("teodora") || emailLower.includes("valerio")) {
        role = "landlord";
        name = emailLower === "arrendador_demo@gmail.com" || emailLower.includes("teodora") ? "Sra. Teodora Quispe" : "Don Valerio Huamán";
      } else {
        role = "student";
        if (emailLower === "estudiante_demo@unsch.edu.pe") {
          name = "Rubén Mendoza";
          career = "Ingeniería de Minas";
        } else if (emailLower.includes("gerson")) {
          name = "Gerson Vílchez";
          isVerified = false;
          verificationStatus = "pending";
        } else {
          name = authEmail.split("@")[0].toUpperCase();
        }
      }

      const dummyAcc: UserAccount = {
        name,
        email: authEmail,
        role,
        faculty: role === "student" ? faculty : undefined,
        career: role === "student" ? career : undefined,
        isVerified,
        verificationStatus
      };
      setCurrentUser(dummyAcc);
      localStorage.setItem("yachakuqwasi_user", JSON.stringify(dummyAcc));
      setIsAuthModalOpen(false);
      setActiveMainTab("dashboard");
      
      // Personalize Maki message
      setChatMessages(prev => [
        ...prev,
        {
          sender: "maki",
          text: `¡Bienvenido de vuelta, ${name}! He cargado tu panel personalizado de ${role === 'student' ? 'Estudiante' : role === 'landlord' ? 'Arrendador' : 'Administrador'}. ¡Qué bueno tenerte aquí!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Logout Action
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("yachakuqwasi_user");
    setActiveMainTab("explore");
  };

  // Handle Mascot Chat Submission
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = {
      sender: "user" as const,
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsMakiTyping(true);

    try {
      const historyToSend = chatMessages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, history: historyToSend }),
      });

      const data = await res.json();
      
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "maki",
            text: data.text || "¡Uy! Tuve un pequeño tropiezo de red por las montañas de Huamanga, pero sigo aquí listo para guiarte. ¡Pregúntame otra vez, hermano!",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsMakiTyping(false);
      }, 600);

    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "maki",
            text: "¡Allillanchu! Parece que mi conexión por satélite en Ayacucho está un poco lenta, pero te sugiero revisar San Blas o Belén mientras nos reconectamos. ¡Ambos son barrios súper universitarios!",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsMakiTyping(false);
      }, 1000);
    }
  };

  // Neighborhood and type lists
  const neighborhoods = ["All", "San Blas", "Av. Independencia", "Belén", "Carmen Alto", "Santa Ana"];
  const types = [
    { label: "Todos", value: "All" },
    { label: "Habitación", value: "room" },
    { label: "Departamento", value: "apartment" },
    { label: "Compartido", value: "shared" }
  ];

  // Filtering Logic
  const filteredListings = listings.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNeighborhood = selectedNeighborhood === "All" || item.neighborhood === selectedNeighborhood;
    const matchesType = selectedType === "All" || item.type === selectedType;
    const matchesPrice = item.pricePen <= maxPrice;
    const matchesMinutes = item.distanceToUnschMinutes <= maxMinutes;

    return matchesSearch && matchesNeighborhood && matchesType && matchesPrice && matchesMinutes;
  });

  // Deoverlapped pins for the map rendering to ensure icons do not overlap
  const deoverlappedListings = React.useMemo(() => {
    const unschX = 50;
    const unschY = 33.33;
    const minDistance = 7.5; // minimum % distance between markers to prevent overlaps
    
    const adjusted = filteredListings.map((item) => {
      const x = item.coordinates?.x ?? (30 + Math.random() * 40);
      const y = item.coordinates?.y ?? (20 + Math.random() * 60);
      return { ...item, adjX: x, adjY: y };
    });

    for (let iter = 0; iter < 10; iter++) {
      let changed = false;
      for (let i = 0; i < adjusted.length; i++) {
        const itemA = adjusted[i];
        
        // Push away from UNSCH center
        const dxU = itemA.adjX - unschX;
        const dyU = itemA.adjY - unschY;
        const distU = Math.sqrt(dxU * dxU + dyU * dyU);
        if (distU < minDistance + 4) {
          const angle = distU > 0 ? Math.atan2(dyU, dxU) : (i * 1.2);
          itemA.adjX = unschX + Math.cos(angle) * (minDistance + 5);
          itemA.adjY = unschY + Math.sin(angle) * (minDistance + 5);
          changed = true;
        }

        // Push away from other markers
        for (let j = 0; j < adjusted.length; j++) {
          if (i === j) continue;
          const itemB = adjusted[j];
          const dx = itemA.adjX - itemB.adjX;
          const dy = itemA.adjY - itemB.adjY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < minDistance) {
            const angle = dist > 0 ? Math.atan2(dy, dx) : (i - j) * 0.5;
            const push = (minDistance - dist) / 2;
            
            itemA.adjX += Math.cos(angle) * push;
            itemA.adjY += Math.sin(angle) * push;
            itemB.adjX -= Math.cos(angle) * push;
            itemB.adjY -= Math.sin(angle) * push;
            changed = true;
          }
        }
        
        itemA.adjX = Math.max(8, Math.min(92, itemA.adjX));
        itemA.adjY = Math.max(8, Math.min(92, itemA.adjY));
      }
      if (!changed) break;
    }
    
    return adjusted;
  }, [filteredListings]);

  // Toggle Favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // Add Amenity
  const handleAddAmenity = () => {
    if (amenityInput.trim() && !newRoom.amenities.includes(amenityInput.trim())) {
      setNewRoom(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput("");
    }
  };

  // Remove Amenity
  const handleRemoveAmenity = (index: number) => {
    setNewRoom(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  // Handle Landlord Listing Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.title || !newRoom.address || !newRoom.contactPhone || !newRoom.landlordName) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    const createdRoom: HousingListing = {
      id: `custom-list-${Date.now()}`,
      title: newRoom.title,
      type: newRoom.type,
      pricePen: Number(newRoom.pricePen),
      distanceToUnschMinutes: Number(newRoom.distanceToUnschMinutes),
      neighborhood: newRoom.neighborhood,
      address: newRoom.address,
      description: newRoom.description || "Cuarto cómodo para estudiante UNSCH.",
      amenities: newRoom.amenities.length > 0 ? newRoom.amenities : ["Agua 24h", "Wi-Fi", "Luz"],
      contactPhone: newRoom.contactPhone,
      landlordName: newRoom.landlordName,
      verifiedByMaki: true,
      images: newRoom.images.length > 0
        ? newRoom.images
        : ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"],
      coordinates: {
        x: Math.floor(Math.random() * 50) + 25,
        y: Math.floor(Math.random() * 50) + 25
      }
    };

    setListings(prev => [createdRoom, ...prev]);
    setFormSuccess(true);
    setTimeout(() => {
      setIsSubmitModalOpen(false);
      setFormSuccess(false);
      setNewRoom({
        title: "",
        type: "room",
        pricePen: 250,
        distanceToUnschMinutes: 8,
        neighborhood: "San Blas",
        address: "",
        description: "",
        amenities: [],
        contactPhone: "",
        landlordName: "",
        images: [],
      });
    }, 1500);
  };

  // Maki dynamic comment on budget
  const getMakiBudgetComment = () => {
    if (totalBudget <= 380) {
      return "¡Excelente ahorro, wawa! Un presupuesto austero y disciplinado. Recuerda comprar tus verduras en el Mercado Nery de Huamanga para ahorrar el doble.";
    } else if (totalBudget <= 550) {
      return "¡Presupuesto ideal para la UNSCH! Estudiarás muy kusi (feliz), comerás bien y podrás alquilar un cuarto en San Blas o Belén muy cerca a tus clases.";
    } else {
      return "¡Presupuesto amplio, hermano! Con esto conseguirás minidepartamentos con baño privado e internet de fibra óptica de alta calidad en Ayacucho.";
    }
  };

  const getRoommateProfile = () => {
    const { study, schedule, order, social } = roommateAnswers;
    if (!study) return { title: "Halcón Equilibrado", desc: "Te adaptas fácilmente a cualquier entorno de estudio." };
    
    let title = "";
    let desc = "";
    
    if (study === "silent" && schedule === "early") {
      title = "Halcón Académico Madrugador";
      desc = "Eres súper disciplinado, valoras el silencio y aprovechas las primeras horas del día para dar el 100% en la UNSCH.";
    } else if (study === "silent" && schedule === "night") {
      title = "Halcón Investigador Nocturno";
      desc = "Prefieres el silencio absoluto de la noche para concentrarte al máximo en tus lecturas y proyectos universitarios.";
    } else if (study === "music" && schedule === "early") {
      title = "Halcón Activo Mañanero";
      desc = "Tienes mucha energía por las mañanas, te gusta estudiar con música estimulante y mantenerte en movimiento.";
    } else {
      title = "Halcón Creativo de Noche";
      desc = "Tu mente fluye mejor tarde por la noche con buena música de fondo. Eres sociable y muy receptivo a ideas nuevas.";
    }
    
    return { title, desc };
  };

  const getCompatibleRoommates = () => {
    return [
      { name: "Juan Diego T.", career: "Ingeniería de Sistemas", match: "97%", phone: "966741258", note: "Busco compartir departamento cerca a la puerta de Ingeniería. No fumo." },
      { name: "Yanet M.", career: "Derecho y Ciencias Políticas", match: "94%", phone: "948123789", note: "Tengo un minidepartamento visto en San Blas y busco roommate para dividir a la mitad!" },
      { name: "Carlos A.", career: "Administración de Empresas", match: "89%", phone: "956321456", note: "Estudio y trabajo los fines de semana. Muy limpio y respetuoso." }
    ];
  };

  const faculties = [
    "Ingeniería de Minas",
    "Educación Inicial",
    "Ciencias de la Salud",
    "Derecho y Ciencias Políticas",
    "Administración de Empresas",
    "Ingeniería Civil",
    "Obstetricia",
    "Arqueología e Historia"
  ];

  // ==========================================
  // STUDENT DASHBOARD (FRESH COLLEGIATE THEME)
  // ==========================================
  const renderStudentDashboard = () => {
    // Check verification progress of currently logged student
    const isApproved = currentUser?.isVerified || currentUser?.verificationStatus === "approved";
    const activeChat = chatsList.find(c => c.id === activeChatId) || chatsList[0];

    const handleSendChatMessage = () => {
      if (!activeChatMessageInput.trim() || !activeChat) return;

      const updatedChats = chatsList.map(c => {
        if (c.id === activeChat.id) {
          const newMsgs = [
            ...c.messages,
            { sender: "student", text: activeChatMessageInput, time: "Ahora" }
          ];
          return {
            ...c,
            messages: newMsgs,
            lastMessage: activeChatMessageInput,
            unread: false
          };
        }
        return c;
      });

      updateChatsAndPersist(updatedChats);
      const sentMsg = activeChatMessageInput;
      setActiveChatMessageInput("");

      // Simulated landlord automated response
      setTimeout(() => {
        const repliedChats = updatedChats.map(c => {
          if (c.id === activeChat.id) {
            const replies = [
              "¡Perfecto estimado! Agendado. Nos encontramos en la puerta de la habitación. No olvides traer tu carnet UNSCH, hermano.",
              "¡Allillanchu! Sí, claro, el precio ya incluye agua caliente y luz. El Wi-Fi es de fibra óptica para que no tengas problemas con tus trabajos de la facultad.",
              "Hola, wawa. Claro que sí, puedes visitarlo con tus padres. La zona es súper segura y hay resguardo del serenazgo.",
              "Entendido. Te guardo la habitación por hoy. Comunícame si lograste hacer el depósito de garantía por Yape."
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            return {
              ...c,
              messages: [
                ...c.messages,
                { sender: "landlord", text: randomReply, time: "Hace un momento" }
              ],
              lastMessage: randomReply
            };
          }
          return c;
        });
        updateChatsAndPersist(repliedChats);
      }, 1500);
    };

    // Budget math
    const percentageUsed = Math.min(100, Math.round((totalBudget / 600) * 100));
    const circumference = 2 * Math.PI * 30; // Radius 30
    const strokeDashoffset = circumference - (percentageUsed / 100) * circumference;

    // Filter current user saved items
    const savedRooms = listings.filter(l => favorites.includes(l.id));

    const handleUploadMockDoc = () => {
      setStudentVerificationProgress("uploading");
      setTimeout(() => {
        setUploadedDocName("CARNET_UNSCH_ESTUDIANTE_2026.png");
        setStudentVerificationProgress("submitted");
        
        // Update user status to 'pending' in the global users database
        const updatedUsers = usersList.map(u => {
          if (u.email === currentUser?.email) {
            return {
              ...u,
              verificationStatus: "pending" as const,
              verificationDoc: "CARNET_UNSCH_ESTUDIANTE_2026.png"
            };
          }
          return u;
        });
        updateUsersAndPersist(updatedUsers);

        // Update active currentUser session
        if (currentUser) {
          const updatedUserSession = { ...currentUser, verificationStatus: "pending" as const, verificationDoc: "CARNET_UNSCH_ESTUDIANTE_2026.png" };
          setCurrentUser(updatedUserSession);
          localStorage.setItem("yachakuqwasi_user", JSON.stringify(updatedUserSession));
        }

        // Add to audit log
        setAuditLogs(prev => [
          {
            id: `log-${Date.now()}`,
            user: currentUser?.name || "Estudiante",
            action: "Carga de documento",
            details: "Subió credencial de estudiante para verificación de identidad.",
            timestamp: "Justo ahora",
            type: "user"
          },
          ...prev
        ]);
      }, 1000);
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="student-dashboard-root">
        
        {/* LEFT COLUMN: UNSCH CARNET + CHATS (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* DIGITAL ACADEMIC ID CARD */}
          <div className="bg-gradient-to-br from-guindo via-guindo-dark to-[#300a0a] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border-2 border-amber-500/20">
            {/* Ambient watermarks */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
              <Compass className="h-48 w-48 stroke-1 text-white animate-spin-slow" />
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black tracking-widest text-[#FFC000] uppercase block font-mono">CREDANCIAL UNIVERSITARIA</span>
                <span className="text-[10px] text-slate-300 font-bold block mt-0.5">UNSCH • Ayacucho</span>
              </div>
              <div className="h-9 w-9 rounded-lg overflow-hidden bg-white/10 p-0.5 border border-white/10">
                <img src={unschLogoIcon} alt="UNSCH Logo" className="w-full h-full object-cover rounded-md" />
              </div>
            </div>

            <div className="flex gap-4 items-center mt-6 relative z-10">
              <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-[#FFC000] bg-slate-50 shrink-0 shadow">
                <img src={makiMascot} alt="Estudiante UNSCH" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1 overflow-hidden">
                <h4 className="text-sm font-black tracking-tight truncate flex items-center gap-1">
                  <span>{currentUser?.name}</span>
                </h4>
                <p className="text-[10px] text-slate-300 font-bold truncate capitalize">{currentUser?.career || "Estudiante General"}</p>
                <p className="text-[8px] text-slate-400 font-mono">ID: 260477-A • 2026-I</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs relative z-10">
              <div>
                <span className="text-[9px] text-slate-400 block font-bold font-mono">ESTADO DE IDENTIDAD</span>
                {isApproved ? (
                  <span className="text-[#FFC000] font-black text-[11px] uppercase tracking-wider flex items-center gap-1 mt-0.5 animate-pulse">
                    <ShieldCheck className="h-4 w-4 text-[#FFD700]" />
                    <span>Estudiante Verificado</span>
                  </span>
                ) : currentUser?.verificationStatus === "pending" ? (
                  <span className="text-sky-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5 animate-spin text-sky-400" />
                    <span>Revisión en cola</span>
                  </span>
                ) : (
                  <span className="text-slate-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Sin Verificar</span>
                  </span>
                )}
              </div>
              
              {/* QR Code Graphic Mock */}
              <div className="bg-white p-1 rounded-lg shrink-0 shadow border border-slate-100 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5 h-7 w-7">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 5 === 0 ? "bg-slate-900" : "bg-white"}`}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MESSAGES WITH LANDLORDS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[340px]">
            <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-guindo" />
                  <span>Mensajes con Arrendadores</span>
                </h4>
                <p className="text-[10px] text-slate-400">Trato directo sin comisiones</p>
              </div>
              <span className="bg-guindo text-white text-[9px] px-2 py-0.5 rounded-full font-black">
                {chatsList.filter(c => c.unread).length} Pendientes
              </span>
            </div>

            {/* Chats List body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {chatsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aún no tienes chats activos. ¡Inicia una conversación haciendo clic en una habitación!
                </div>
              ) : (
                chatsList.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      // Mark as read
                      const updated = chatsList.map(c => c.id === chat.id ? { ...c, unread: false } : c);
                      updateChatsAndPersist(updated);
                    }}
                    className={`w-full text-left p-3.5 flex gap-3 transition-colors ${
                      activeChatId === chat.id ? "bg-guindo/5 border-l-4 border-guindo" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-9 w-9 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={chat.landlordAvatar} alt={chat.landlordName} className="w-full h-full object-cover" />
                      </div>
                      <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        chat.status === "online" ? "bg-emerald-500" : "bg-slate-300"
                      }`}></span>
                    </div>
                    <div className="flex-1 overflow-hidden space-y-0.5">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-extrabold text-slate-800 truncate">{chat.landlordName}</h5>
                        {chat.unread && <span className="h-2 w-2 rounded-full bg-guindo shrink-0 animate-ping"></span>}
                      </div>
                      <p className="text-[10px] text-guindo font-black truncate">{chat.listingTitle}</p>
                      <p className="text-[10px] text-slate-500 truncate italic">"{chat.lastMessage}"</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: BUDGET + SAVED FAVORITES (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* INTERACTIVE BUDGET CALCULATOR */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black text-guindo tracking-widest uppercase block font-mono">PLANIFICADOR FINANCIERO</span>
                <h3 className="text-md font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 mt-0.5">
                  <Calculator className="h-5 w-5 text-guindo" />
                  <span>Calculadora de Presupuesto Mensual</span>
                </h3>
              </div>
              <span className="text-[9px] bg-[#FFFDF9] border border-[#F0ECE3] text-guindo font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                Maki Consejos
              </span>
            </div>

            {/* Circular progress chart row */}
            <div className="flex flex-col sm:flex-row gap-5 items-center bg-[#FDFBF7] p-4 rounded-2xl border border-[#F0ECE3]">
              
              {/* Dynamic SVG Donut Chart */}
              <div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="30" className="stroke-slate-100 fill-none" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    className="stroke-guindo fill-none transition-all duration-300"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[15px] font-black text-slate-800 leading-none">{percentageUsed}%</span>
                  <span className="text-[7px] text-slate-400 font-bold block uppercase mt-0.5">Utilizado</span>
                </div>
              </div>

              <div className="space-y-1 flex-1 text-center sm:text-left">
                <span className="text-[10px] text-slate-400 font-bold block">TOTAL MENSUAL ESTIMADO</span>
                <p className="text-xl font-black text-slate-900 font-mono">
                  S/. {totalBudget} <span className="text-xs font-bold text-slate-500">PEN / S/. 600 máx</span>
                </p>
                <p className="text-[11px] leading-tight text-slate-500 italic font-medium">
                  {totalBudget > 600 ? "⚠️ ¡Cuidado, hermano! Superaste el tope sugerido de 600 soles." : getMakiBudgetComment()}
                </p>
              </div>
            </div>

            {/* Sliders layout */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-600">Alquiler de Cuarto:</span>
                  <span className="font-black text-slate-800 font-mono">S/. {rentCost} PEN</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="10"
                  value={rentCost}
                  onChange={(e) => setRentCost(Number(e.target.value))}
                  className="w-full accent-guindo cursor-pointer"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-600">Alimentación (Pensión/Mercado):</span>
                  <span className="font-black text-slate-800 font-mono">S/. {foodCost} PEN</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="350"
                  step="10"
                  value={foodCost}
                  onChange={(e) => setFoodCost(Number(e.target.value))}
                  className="w-full accent-guindo cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-600">Movilidad/Motos:</span>
                    <span className="font-black text-slate-800 font-mono">S/. {transportCost} PEN</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={transportCost}
                    onChange={(e) => setTransportCost(Number(e.target.value))}
                    className="w-full accent-guindo cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-600">Material de Estudio:</span>
                    <span className="font-black text-slate-800 font-mono">S/. {studyCost} PEN</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={studyCost}
                    onChange={(e) => setStudyCost(Number(e.target.value))}
                    className="w-full accent-guindo cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MY SAVED / FAVORITE ROOMS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="h-4.5 w-4.5 text-rose-500 fill-rose-500" />
              <span>Mis Alojamientos Favoritos ({savedRooms.length})</span>
            </h4>

            {savedRooms.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                Aún no has guardado ninguna habitación. ¡Marca con un ❤️ tus opciones preferidas mientras exploras el mapa!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {savedRooms.map((room) => (
                  <div key={room.id} className="border border-slate-100 rounded-2xl p-3 flex gap-3 items-center hover:border-slate-200 transition-colors bg-slate-50/50">
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={room.images[0]} alt={room.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden text-left space-y-0.5">
                      <h5 className="text-xs font-extrabold text-slate-800 truncate">{room.title}</h5>
                      <p className="text-[10px] text-slate-400 font-semibold">{room.neighborhood} • {room.address}</p>
                      <span className="text-[11px] font-black text-guindo font-mono">S/. {room.pricePen} PEN / mes</span>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => setSelectedListing(room)}
                        className="bg-slate-100 text-slate-700 hover:bg-guindo hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Ver Ficha
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(room.id, e)}
                        className="text-rose-500 hover:text-rose-700 text-[10px] font-black cursor-pointer underline py-0.5"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: CHAT PANEL + ROOMMATE QUIZ & VERIFICATION STATUS (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* ACTIVE CHAT POPUP MOCK */}
          {activeChat && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[340px] overflow-hidden">
              <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-50 border border-slate-700 shrink-0">
                    <img src={activeChat.landlordAvatar} alt={activeChat.landlordName} className="w-full h-full object-cover" />
                  </div>
                  <div className="truncate">
                    <h5 className="text-[11px] font-black truncate">{activeChat.landlordName}</h5>
                    <span className="text-[8px] text-emerald-400 block font-mono">En línea ahora mismo</span>
                  </div>
                </div>
                <span className="text-[8px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded uppercase font-bold">Chat Privado</span>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#FAF9F5]">
                <div className="text-center text-[9px] text-slate-400 font-bold bg-slate-100 py-0.5 px-2 rounded-full w-max mx-auto uppercase">
                  Conexión directa UNSCH
                </div>
                {activeChat.messages.map((m: any, idx: number) => (
                  <div key={idx} className={`max-w-[85%] space-y-0.5 ${m.sender === "student" ? "ml-auto" : "mr-auto"}`}>
                    <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed shadow-xs ${
                      m.sender === "student"
                        ? "bg-guindo text-white rounded-tr-none"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                    }`}>
                      {m.text}
                    </div>
                    <span className="text-[8px] text-slate-400 block text-right font-mono px-0.5">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* Chat Send input bar */}
              <div className="p-2 border-t border-slate-200 bg-white flex gap-1.5 shrink-0">
                <input
                  type="text"
                  placeholder="Escribe tu respuesta a Sra. Teodora..."
                  value={activeChatMessageInput}
                  onChange={(e) => setActiveChatMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChatMessage();
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-guindo font-medium"
                />
                <button
                  onClick={handleSendChatMessage}
                  className="bg-guindo text-white p-2 rounded-lg hover:bg-opacity-95 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STUDENT VERIFICATION STEPS PROGRESS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-guindo" />
              <span>Verificación de Identidad</span>
            </h4>

            {isApproved ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center space-y-2">
                <div className="h-9 w-9 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="h-5 w-5" />
                </div>
                <h5 className="font-extrabold text-xs text-emerald-800">¡Identidad Verificada!</h5>
                <p className="text-[10px] text-emerald-600 leading-snug">
                  Tu carnet de la UNSCH fue auditado y aprobado. Gozas de trato seguro y destacado.
                </p>
              </div>
            ) : currentUser?.verificationStatus === "pending" ? (
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sky-800">
                  <Clock className="h-4 w-4 animate-spin text-sky-600 shrink-0" />
                  <h5 className="font-extrabold text-xs">Documento en Revisión</h5>
                </div>
                <div className="text-[10px] space-y-1.5 text-slate-500">
                  <p>✓ Archivo: <span className="font-mono text-[9px] bg-slate-200/50 p-0.5 rounded">{currentUser.verificationDoc}</span></p>
                  <p>⌛ Cola de aprobación: El administrador Steve Ovalle tiene este carnet en su mesa de trabajo en vivo.</p>
                </div>
                <div className="bg-sky-100/50 p-2 rounded-lg text-[9px] text-sky-700 leading-tight">
                  💡 <strong>Tip de prueba:</strong> Cambia al rol <strong>Administrador Demo</strong> en la barra superior para ver la solicitud y aprobarla de un clic.
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Evita fraudes y gana prioridad en las visitas subiendo una foto de tu carnet universitario o matrícula de la UNSCH.
                </p>
                
                {studentVerificationProgress === "none" ? (
                  <button
                    onClick={handleUploadMockDoc}
                    className="w-full bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 text-slate-700 py-3 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4 text-slate-500" />
                    <span>Cargar Carnet Estudiantil (Mock)</span>
                  </button>
                ) : studentVerificationProgress === "uploading" ? (
                  <div className="text-center py-2 space-y-1">
                    <Clock className="h-4 w-4 animate-spin text-guindo mx-auto" />
                    <span className="text-[9px] text-slate-400 font-mono">Cargando archivo en servidor...</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* ROOMMATE MATCH QUIZ STATUS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-guindo" />
              <span>Roommates Compatibles</span>
            </h4>

            {roommateQuizStep !== 5 ? (
              <div className="space-y-2.5 text-left bg-amber-50/20 border border-amber-200/50 p-3.5 rounded-2xl">
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  ¿Tienes una habitación de sobra o buscas con quién dividir gastos? Resuelve nuestro test de Maki.
                </p>
                <button
                  onClick={() => {
                    setRoommateQuizStep(1);
                    setActiveBentoTab("roommate");
                    document.getElementById("btn-chat-maki")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-guindo text-white text-[10px] font-black px-3 py-2 rounded-xl hover:bg-guindo-dark transition-all cursor-pointer block text-center"
                >
                  Resolver Test de Convivencia
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-50 p-2.5 rounded-xl text-left border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-bold">TU PERFIL HALLADO</span>
                  <span className="font-extrabold text-[11px] text-guindo block mt-0.5">🦅 {getRoommateProfile().title}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-400 block font-bold text-left">ESTUDIANTES COMPATIBLES:</span>
                  {getCompatibleRoommates().map((r, i) => (
                    <div key={i} className="border border-slate-100 p-2.5 rounded-xl text-left text-[11px] bg-[#FFFDF9] space-y-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-800">{r.name}</span>
                        <span className="text-emerald-600 font-extrabold text-[10px] bg-emerald-50 px-1.5 rounded">{r.match} Match</span>
                      </div>
                      <p className="text-[9px] text-slate-400 italic font-medium">"{r.note}"</p>
                      <a href={`tel:${r.phone}`} className="text-guindo text-[9px] font-bold block hover:underline">📱 Llamar: {r.phone}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    );
  };

  // ==========================================
  // LANDLORD DASHBOARD (REAL-ESTATE WORKSPACE)
  // ==========================================
  const renderLandlordDashboard = () => {
    // Landlord owns listings matching landlordName Teodora or Valerio depending on currentUser
    const isTeodora = currentUser?.name.includes("Teodora") || currentUser?.email.includes("teodora");
    const landlordName = isTeodora ? "Sra. Teodora Quispe" : "Don Valerio Huamán";
    
    const landlordListings = listings.filter(l => l.landlordName.toLowerCase().includes(landlordName.toLowerCase()) || l.landlordName.toLowerCase().includes("propietario"));
    const approvedListings = landlordListings.filter(l => l.status === "approved" || !l.status);
    const pendingListings = landlordListings.filter(l => l.status === "pending");
    
    // Revenue sum in Soles
    const totalEarnings = approvedListings.reduce((sum, item) => sum + item.pricePen, 0);

    const toggleListingStatus = (id: string, currentStatus: any) => {
      const nextStatus = currentStatus === "suspended" ? "approved" : "suspended";
      const updatedListings = listings.map(l => {
        if (l.id === id) {
          return { ...l, status: nextStatus as any };
        }
        return l;
      });
      setListings(updatedListings);
      localStorage.setItem("yachakuqwasi_listings", JSON.stringify(updatedListings));

      // Audit log addition
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          user: landlordName,
          action: nextStatus === "suspended" ? "Pausa de anuncio" : "Reactivación de anuncio",
          details: `Se cambió el estado del anuncio '${listings.find(x => x.id === id)?.title}' a ${nextStatus === "suspended" ? "Pausado" : "Activo"}.`,
          timestamp: "Justo ahora",
          type: "listing"
        },
        ...prev
      ]);
    };

    return (
      <div className="space-y-6 animate-fade-in" id="landlord-dashboard-root">
        
        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-left">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Mis Anuncios Activos</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{approvedListings.length}</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{pendingListings.length} en cola de aprobación</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-left">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Recaudación Estimada</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block font-mono text-guindo">S/. {totalEarnings} PEN</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Suma mensual de anuncios activos</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-left">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Consultas Recibidas</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">14</span>
            <span className="text-[10px] text-[#FFC000] font-bold mt-0.5 block">¡Leads altamente interesados!</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-left flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Escudo de Dueño</span>
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1 block flex items-center gap-1">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span>Socio Aprobado</span>
              </span>
            </div>
            <span className="text-[9px] text-slate-400">Verificado por carnet y DNI</span>
          </div>

        </div>

        {/* WORKSPACE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LISTINGS MANAGEMENT BOARD */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="h-4.5 w-4.5 text-guindo" />
                  <span>Mis Habitaciones y Departamentos</span>
                </h4>
                <p className="text-[10px] text-slate-400">Control de visibilidad e información en tiempo real</p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="bg-guindo text-white text-[11px] font-black px-4 py-2 rounded-xl hover:bg-guindo-dark transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Publicar Nueva Habitación</span>
              </button>
            </div>

            {landlordListings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-3">
                <p>No tienes habitaciones registradas a tu nombre bajo el preset {landlordName}.</p>
                <button
                  onClick={() => {
                    // Let's create a template listing for them
                    const mockRoom: HousingListing = {
                      id: `room-${Date.now()}`,
                      title: `Cuarto Universitario Amplio de ${landlordName}`,
                      type: "room",
                      pricePen: 280,
                      distanceToUnschMinutes: 6,
                      neighborhood: "San Blas",
                      address: "Jr. Tres Máscaras 510",
                      description: "Hermosa habitación con baño compartido y excelente conectividad de fibra óptica.",
                      amenities: ["Wi-Fi Fibra", "Luz y Agua incluidos", "Baño Compartido"],
                      contactPhone: "+51 966 123 456",
                      landlordName: landlordName,
                      verifiedByMaki: true,
                      images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"],
                      coordinates: { x: 45, y: 35 },
                      status: "approved"
                    };
                    const nextListings = [mockRoom, ...listings];
                    setListings(nextListings);
                    localStorage.setItem("yachakuqwasi_listings", JSON.stringify(nextListings));
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold cursor-pointer"
                >
                  Crear Habitación de Demostración al Instante
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {landlordListings.map((room) => {
                  const isSuspended = room.status === "suspended";
                  return (
                    <div key={room.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 text-left relative bg-slate-50/20">
                      <div className="h-28 rounded-xl overflow-hidden bg-slate-100 relative">
                        <img src={room.images[0]} alt={room.title} className="w-full h-full object-cover" />
                        <span className={`absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow ${
                          isSuspended ? "bg-red-500 text-white" : "bg-emerald-500 text-white animate-pulse"
                        }`}>
                          {isSuspended ? "Pausado / Suspendido" : "Anuncio Activo"}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">{room.neighborhood} • S/. {room.pricePen} / mes</span>
                        <h5 className="text-xs font-extrabold text-slate-800 line-clamp-1">{room.title}</h5>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-medium">A {room.distanceToUnschMinutes} min de UNSCH</span>
                        <button
                          onClick={() => toggleListingStatus(room.id, room.status || "approved")}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            isSuspended
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {isSuspended ? "Reactivar Anuncio" : "Pausar Alquiler"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* INQUIRIES & MESSAGES FOR LANDLORDS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Direct messages threads shortcut */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-left">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="h-4.5 w-4.5 text-guindo" />
                <span>Mensajes de Interesados</span>
              </h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                Comunícate de forma privada con los wawas de la UNSCH para responder dudas, agendar visitas guiadas y reservar habitaciones.
              </p>

              <div className="divide-y divide-slate-100 pt-2">
                <div className="py-3 flex gap-3 items-center">
                  <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                    R
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h5 className="text-xs font-bold text-slate-800 truncate">Rubén Mendoza (Sistemas)</h5>
                    <p className="text-[10px] text-slate-400 truncate">"Sra. Teodora, ¿a qué hora puedo ir a ver el cuarto?"</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveMainTab("dashboard");
                      // Switch to student view or handle mock response
                      alert("¡Perfecto! Abre el panel de chats del estudiante para simular el diálogo en tiempo real.");
                    }}
                    className="text-guindo text-[10px] font-black cursor-pointer underline hover:text-guindo-dark shrink-0"
                  >
                    Responder
                  </button>
                </div>

                <div className="py-3 flex gap-3 items-center">
                  <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                    K
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h5 className="text-xs font-bold text-slate-800 truncate">Katherin Ccoyllo (Educación)</h5>
                    <p className="text-[10px] text-slate-400 truncate">"Hola, ¿la cocina compartida tiene refrigeradora?"</p>
                  </div>
                  <span className="text-[9px] bg-slate-100 text-slate-400 font-bold px-1.5 py-0.5 rounded">Respondido</span>
                </div>
              </div>
            </div>

            {/* Verification document status */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5 text-left">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-guindo" />
                <span>Estado de Propietario Verificado</span>
              </h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                Sube tu DNI y tu constancia de posesión o certificado registral de propiedad para que tus inmuebles lleven el distintivo especial amarillo "Maki Verificado".
              </p>
              
              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-extrabold text-emerald-800">¡Socio Verificado con Éxito!</h5>
                  <p className="text-[10px] text-emerald-600 leading-tight mt-0.5">Tus credenciales están registradas en la base de datos de Maki. Los estudiantes te ven con total confianza.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  };

  // ==========================================
  // ADMINISTRATOR DASHBOARD (COMMAND CENTER)
  // ==========================================
  const renderAdminDashboard = () => {
    // Basic audit indices
    const totalUsers = usersList.length;
    const totalListings = listings.length;
    const pendingDocs = verificationRequests.length;
    const activeAudits = auditLogs.length;

    // Approve Identity Action
    const approveUserIdentity = (email: string) => {
      const updated = usersList.map(u => {
        if (u.email === email) {
          return {
            ...u,
            isVerified: true,
            verificationStatus: "approved" as const
          };
        }
        return u;
      });
      updateUsersAndPersist(updated);

      // Add to audit logs
      const userName = usersList.find(u => u.email === email)?.name || "Usuario";
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          user: "Admin (Steve)",
          action: "Aprobó credencial",
          details: `Se validó de forma satisfactoria el carnet/documento de '${userName}'.`,
          timestamp: "Justo ahora",
          type: "user"
        },
        ...prev
      ]);

      // If approved user is current session student wawa, sync currentSession
      if (currentUser && currentUser.email === email) {
        const nextSession = { ...currentUser, isVerified: true, verificationStatus: "approved" as const };
        setCurrentUser(nextSession);
        localStorage.setItem("yachakuqwasi_user", JSON.stringify(nextSession));
      }
    };

    // Reject Identity Action
    const rejectUserIdentity = (email: string) => {
      const updated = usersList.map(u => {
        if (u.email === email) {
          return {
            ...u,
            isVerified: false,
            verificationStatus: "rejected" as const
          };
        }
        return u;
      });
      updateUsersAndPersist(updated);

      // Add to audit logs
      const userName = usersList.find(u => u.email === email)?.name || "Usuario";
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          user: "Admin (Steve)",
          action: "Rechazó credencial",
          details: `Se rechazó la credencial subida de '${userName}' por falta de legibilidad o datos falsos.`,
          timestamp: "Justo ahora",
          type: "user"
        },
        ...prev
      ]);

      if (currentUser && currentUser.email === email) {
        const nextSession = { ...currentUser, isVerified: false, verificationStatus: "rejected" as const };
        setCurrentUser(nextSession);
        localStorage.setItem("yachakuqwasi_user", JSON.stringify(nextSession));
      }
    };

    // Suspend Listing Action
    const suspendListingByAdmin = (id: string) => {
      const updatedListings = listings.map(l => {
        if (l.id === id) {
          return { ...l, status: "suspended" as const };
        }
        return l;
      });
      setListings(updatedListings);
      localStorage.setItem("yachakuqwasi_listings", JSON.stringify(updatedListings));

      // Audit Log Addition
      const adTitle = listings.find(l => l.id === id)?.title || "Anuncio";
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          user: "Admin (Steve)",
          action: "Moderar Anuncio: SUSPENDER",
          details: `Se suspendió el anuncio '${adTitle}' por reclamos o reporte de información desactualizada.`,
          timestamp: "Justo ahora",
          type: "listing"
        },
        ...prev
      ]);
    };

    // Approve Listing / Verify Maki action
    const approveListingByAdmin = (id: string) => {
      const updatedListings = listings.map(l => {
        if (l.id === id) {
          return { ...l, status: "approved" as const, verifiedByMaki: true };
        }
        return l;
      });
      setListings(updatedListings);
      localStorage.setItem("yachakuqwasi_listings", JSON.stringify(updatedListings));

      // Audit Log Addition
      const adTitle = listings.find(l => l.id === id)?.title || "Anuncio";
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          user: "Admin (Steve)",
          action: "Moderar Anuncio: APROBAR/VERIFICAR",
          details: `Se aprobó y activó la verificación Maki para el anuncio '${adTitle}'.`,
          timestamp: "Justo ahora",
          type: "listing"
        },
        ...prev
      ]);
    };

    // User Table Action: change role
    const handleSetUserRole = (email: string, newRole: "student" | "landlord" | "admin") => {
      const updated = usersList.map(u => {
        if (u.email === email) {
          return { ...u, role: newRole };
        }
        return u;
      });
      updateUsersAndPersist(updated);
      
      const userName = usersList.find(u => u.email === email)?.name || "Usuario";
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          user: "Admin (Steve)",
          action: "Cambio de Rol",
          details: `Se actualizó el rol de '${userName}' a '${newRole.toUpperCase()}'.`,
          timestamp: "Justo ahora",
          type: "user"
        },
        ...prev
      ]);
    };

    return (
      <div className="space-y-8 animate-fade-in" id="admin-dashboard-root">
        
        {/* STATS MATRIX */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 text-left relative overflow-hidden">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Credenciales Pendientes</span>
            <span className="text-3xl font-black mt-1 block font-mono text-amber-400">{pendingDocs}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Alumnos y dueños en cola</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-left">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Ofertas de Vivienda</span>
            <span className="text-3xl font-black mt-1 block font-mono text-slate-800">{totalListings}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">
              ✓ {listings.filter(l => l.status === "approved" || !l.status).length} activos públicamente
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-left">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Cuentas Registradas</span>
            <span className="text-3xl font-black mt-1 block font-mono text-slate-800">{totalUsers}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Estudiantes: {usersList.filter(u => u.role === "student").length} | Dueños: {usersList.filter(u => u.role === "landlord").length}</span>
          </div>

          <div className="bg-[#FFFDF9] p-5 rounded-3xl border border-[#F0ECE3] text-left">
            <span className="text-[10px] text-guindo block font-black uppercase tracking-wider">Eventos Recientes</span>
            <span className="text-3xl font-black mt-1 block font-mono text-guindo">{activeAudits}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Logs de seguridad grabados</span>
          </div>

        </div>

        {/* OPERATIONS BOARD CONTAINER */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-left">
          
          {/* Admin Navigation Sub-Tabs */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setAdminActiveSubTab("verifications")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  adminActiveSubTab === "verifications"
                    ? "bg-guindo text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Revisión de Identidad</span>
                {pendingDocs > 0 && (
                  <span className="bg-[#FFD700] text-slate-900 text-[9px] px-1.5 rounded-full font-black ml-1 animate-pulse">
                    {pendingDocs}
                  </span>
                )}
              </button>

              <button
                onClick={() => setAdminActiveSubTab("listings")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  adminActiveSubTab === "listings"
                    ? "bg-guindo text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Monitoreo de Anuncios</span>
              </button>

              <button
                onClick={() => setAdminActiveSubTab("users")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  adminActiveSubTab === "users"
                    ? "bg-guindo text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Control de Usuarios</span>
              </button>

              <button
                onClick={() => setAdminActiveSubTab("logs")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  adminActiveSubTab === "logs"
                    ? "bg-guindo text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Compass className="h-4 w-4" />
                <span>Registro de Auditoría</span>
              </button>
            </div>
            
            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">
              MODO OPERACIONES ACTIVO • SECURE INTERFACE
            </div>
          </div>

          {/* Admin Panels Body Content */}
          <div className="p-6">
            
            {/* SUB-PANEL 1: IDENTITY VERIFICATION REVIEW */}
            {adminActiveSubTab === "verifications" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Cola de Solicitudes de Verificación</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{pendingDocs} pendientes de validación</span>
                </div>

                {pendingDocs === 0 ? (
                  <div className="border border-dashed border-slate-200 p-12 text-center rounded-2xl space-y-2">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                    <h5 className="font-extrabold text-slate-700">¡Excelente! Cola de identidades limpia</h5>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      Todos los estudiantes de la UNSCH y arrendadores registrados han sido validados o no han subido documentos todavía.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs text-left divide-y divide-slate-200">
                      <thead className="bg-slate-50 font-bold text-slate-600">
                        <tr>
                          <th className="px-5 py-3">Nombre / Email</th>
                          <th className="px-5 py-3">Rol / Programa Académico</th>
                          <th className="px-5 py-3">Documento Adjunto</th>
                          <th className="px-5 py-3 text-right">Acciones de Moderador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {verificationRequests.map((req) => (
                          <tr key={req.email} className="hover:bg-slate-50/50">
                            <td className="px-5 py-4">
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-slate-800 block">{req.name}</span>
                                <span className="text-slate-400 font-mono text-[10px] block">{req.email}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {req.role === "student" ? (
                                <div className="space-y-0.5">
                                  <span className="text-guindo font-black uppercase text-[10px] bg-guindo/5 px-1.5 py-0.5 rounded">Estudiante UNSCH</span>
                                  <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">{req.career}</span>
                                </div>
                              ) : (
                                <span className="text-sky-800 font-black uppercase text-[10px] bg-sky-50 px-1.5 py-0.5 rounded">Arrendador</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <div className="p-1.5 bg-slate-100 rounded border border-slate-200 shrink-0">
                                  📄
                                </div>
                                <div className="overflow-hidden">
                                  <span className="font-mono text-[10px] block truncate text-slate-600 max-w-[150px] font-bold" title={req.verificationDoc}>
                                    {req.verificationDoc || "No disponible"}
                                  </span>
                                  <span className="text-[9px] text-emerald-600 block font-bold">✓ Carga Segura</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => approveUserIdentity(req.email)}
                                  className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                                >
                                  ✔ Aprobar
                                </button>
                                <button
                                  onClick={() => rejectUserIdentity(req.email)}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  ❌ Rechazar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUB-PANEL 2: HOUSING LISTINGS MODERATION TABLE */}
            {adminActiveSubTab === "listings" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Monitoreo de Alojamientos y Anuncios</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Base de datos en tiempo real ({totalListings} anuncios totales)</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-5 py-3">Inmueble / Alquiler</th>
                        <th className="px-5 py-3">Ubicación / Cercanía</th>
                        <th className="px-5 py-3">Arrendador / Teléfono</th>
                        <th className="px-5 py-3">Estado de Filtro</th>
                        <th className="px-5 py-3 text-right">Acciones de Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {listings.map((item) => {
                        const isSuspended = item.status === "suspended";
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-4">
                              <div className="flex gap-3 items-center">
                                <div className="h-10 w-10 rounded overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="overflow-hidden max-w-[200px]">
                                  <span className="font-extrabold text-slate-800 block truncate" title={item.title}>{item.title}</span>
                                  <span className="text-guindo font-black font-mono text-[10px]">S/. {item.pricePen} PEN / mes</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-700 block">{item.neighborhood}</span>
                                <span className="text-slate-400 text-[10px] block">{item.address} • A {item.distanceToUnschMinutes} min UNSCH</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-700 block">{item.landlordName}</span>
                                <span className="text-slate-400 font-mono text-[10px] block">{item.contactPhone}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {isSuspended ? (
                                <span className="bg-red-100 text-red-800 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider inline-block">
                                  ● Suspendido (Hidden)
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider inline-block">
                                    ● Activo (Visible)
                                  </span>
                                  {item.verifiedByMaki && (
                                    <span className="text-[9px] font-bold text-amber-600 block font-mono">⚡ Maki Verificado</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex gap-1.5 justify-end">
                                {!isSuspended ? (
                                  <>
                                    {!item.verifiedByMaki && (
                                      <button
                                        onClick={() => approveListingByAdmin(item.id)}
                                        className="bg-[#FFC000] text-slate-900 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all hover:opacity-90 cursor-pointer shadow-xs"
                                        title="Otorga el escudo Maki Verificado"
                                      >
                                        ★ Verificar Maki
                                      </button>
                                    )}
                                    <button
                                      onClick={() => suspendListingByAdmin(item.id)}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                      title="Oculta esta oferta del mapa y búsqueda"
                                    >
                                      Suspender
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => approveListingByAdmin(item.id)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                                  >
                                    Reactivar Anuncio
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-PANEL 3: USER MANAGEMENT PORTAL */}
            {adminActiveSubTab === "users" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Control de Usuarios Registrados</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{totalUsers} cuentas totales</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-5 py-3">Nombre / Email</th>
                        <th className="px-5 py-3">Rol del Sistema</th>
                        <th className="px-5 py-3">Verificación</th>
                        <th className="px-5 py-3 text-right">Rol de Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {usersList.map((user) => (
                        <tr key={user.email} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-extrabold text-slate-800">
                            <div className="space-y-0.5">
                              <span className="block">{user.name}</span>
                              <span className="text-slate-400 font-mono text-[10px] block font-normal">{user.email}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              user.role === "admin" ? "bg-rose-100 text-rose-800" :
                              user.role === "landlord" ? "bg-sky-100 text-sky-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {user.isVerified ? (
                              <span className="text-emerald-600 font-black text-[10px] flex items-center gap-1">
                                🟢 Aprobado por Maki
                              </span>
                            ) : user.verificationStatus === "pending" ? (
                              <span className="text-amber-600 font-black text-[10px] flex items-center gap-1 animate-pulse">
                                🟡 Documento Pendiente
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-[10px]">
                                ⚪ Sin verificación
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex gap-2 justify-end items-center">
                              <select
                                value={user.role}
                                onChange={(e) => handleSetUserRole(user.email, e.target.value as any)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-bold bg-white text-slate-700 cursor-pointer focus:ring-1 focus:ring-guindo"
                              >
                                <option value="student">Estudiante</option>
                                <option value="landlord">Arrendador</option>
                                <option value="admin">Administrador</option>
                              </select>
                              <button
                                onClick={() => {
                                  // toggle verification
                                  const updated = usersList.map(u => u.email === user.email ? { ...u, isVerified: !u.isVerified, verificationStatus: !u.isVerified ? "approved" as const : "none" as const } : u);
                                  updateUsersAndPersist(updated);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                T_Verificar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-PANEL 4: AUDIT LOG TIMELINE */}
            {adminActiveSubTab === "logs" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Bitácora de Auditoría del Sistema</h4>
                  <button
                    onClick={() => setAuditLogs([])}
                    className="text-guindo text-[10px] font-black underline cursor-pointer hover:text-guindo-dark"
                  >
                    Limpiar Bitácora
                  </button>
                </div>

                <div className="bg-[#FAF9F5] border border-slate-200 p-6 rounded-2xl max-h-[380px] overflow-y-auto">
                  <div className="relative pl-6 border-l-2 border-guindo/20 space-y-5 py-2 text-xs">
                    {auditLogs.length === 0 ? (
                      <p className="text-slate-400 text-center italic py-4">No hay logs registrados en este ciclo.</p>
                    ) : (
                      auditLogs.map((log) => (
                        <div key={log.id} className="relative text-left">
                          <span className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 border-[#FAF9F5] flex items-center justify-center text-[8px] font-bold text-white ${
                            log.type === "system" ? "bg-emerald-500" : log.type === "user" ? "bg-amber-500" : "bg-guindo"
                          }`}>
                            L
                          </span>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center gap-4">
                              <span className="font-extrabold text-slate-800">{log.action}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-medium">{log.timestamp}</span>
                            </div>
                            <p className="text-slate-500 leading-relaxed text-[11px]">{log.details}</p>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Ejecutado por: {log.user}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#334155] font-sans selection:bg-guindo selection:text-white">
      
      {/* INSTITUTIONAL BRAND HEADER */}
      <header className="border-b border-plomo-light bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl overflow-hidden border border-guindo/20 bg-white shadow-md flex items-center justify-center shrink-0">
              <img src={unschLogoIcon} alt="UNSCH Campus Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black tracking-widest text-guindo uppercase">UNSCH Portal</span>
                <span className="bg-plomo-light text-plomo-dark text-[9px] px-2 py-0.5 rounded-full font-bold">1677</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-guindo tracking-tight flex items-center gap-1">
                Yachakuq<span className="text-plomo-dark font-extrabold">Wasi</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* User Profile / Login trigger */}
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-guindo/30 bg-slate-50 shrink-0 shadow-sm">
                  <img src={makiMascot} alt="Usuario" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</span>
                  <span className="text-[9px] text-slate-400 capitalize font-mono leading-tight">
                    {currentUser.role === "student" ? `Estudiante (${currentUser.career || currentUser.faculty})` : currentUser.role === "admin" ? "Administrador" : "Arrendador"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4 text-guindo" />
                  <span className="hidden md:inline">Salir</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-2 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-black hover:border-guindo hover:text-guindo transition-all cursor-pointer bg-white shadow-sm"
              >
                <div className="h-6 w-6 rounded-full overflow-hidden border border-guindo/20 bg-slate-50 shrink-0">
                  <img src={makiMascot} alt="Maki Login Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span>Ingresar / Registrarse</span>
              </button>
            )}

            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 bg-guindo text-white px-4 py-2 rounded-xl font-bold hover:bg-guindo-dark transition-all shadow-md cursor-pointer text-xs sm:text-sm"
              id="btn-chat-maki"
            >
              <MessageCircle className="h-4 w-4 text-[#FFD700]" />
              <span className="hidden sm:inline">Mascota IA: Maki</span>
              <span className="inline sm:hidden">Maki</span>
            </button>

            {currentUser && (currentUser.role === "landlord" || currentUser.role === "admin") && (
              <button
                onClick={() => {
                  setIsSubmitModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 border-2 border-dashed px-3.5 py-2 rounded-xl font-bold transition-all text-sm cursor-pointer border-guindo text-guindo hover:bg-guindo/5 bg-white shadow-sm animate-fade-in"
              >
                <Plus className="h-4 w-4 text-guindo" />
                <span>Publicar Habitación</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* SECTOR TAB SELECTOR: EXPLORE VS PORTAL */}
      <div className="bg-white border-b border-slate-200 sticky top-[68px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-12">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveMainTab("explore")}
              className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeMainTab === "explore"
                  ? "border-guindo text-guindo"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Explorar Habitaciones</span>
            </button>
            {currentUser && (
              <button
                onClick={() => setActiveMainTab("dashboard")}
                className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeMainTab === "dashboard"
                    ? "border-guindo text-guindo"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Mi Portal UNSCH (Dashboard)</span>
                <span className="bg-guindo text-white text-[8px] px-1.5 py-0.5 rounded-full font-black scale-90">
                  Nuevo
                </span>
              </button>
            )}
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Ayacucho, Perú • Portal Universitario</span>
          </div>
        </div>
      </div>

      {activeMainTab === "explore" ? (
        <>
          {/* COMPACT CLEAN HERO SEARCH ENGINE */}
          <section className="relative min-h-[420px] flex items-center justify-center py-12 px-4 bg-gradient-to-r from-guindo-dark to-[#300a0a] text-white overflow-hidden">
        
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={unschEntranceImg} 
            alt="Pórtico de ingreso principal de la UNSCH" 
            className="w-full h-full object-cover object-center opacity-40 mix-blend-overlay animate-fade-in"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#250808]/80 via-transparent to-[#100303]/90"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 w-full">
          
          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight md:leading-none">
              Encuentra alojamiento para estudiantes en <span className="text-[#FFC000]">Ayacucho</span>
            </h2>
          </div>

          {/* STUDENT.COM STYLE MASSIVE SEARCH BOX */}
          <div className="bg-white text-slate-800 p-4 md:p-6 rounded-3xl shadow-2xl border border-slate-100 max-w-3xl mx-auto">
            
            {/* Simple tab selector */}
            <div className="flex border-b border-slate-100 pb-3 mb-4 gap-4 text-xs font-bold text-slate-500">
              <span className="text-guindo border-b-2 border-guindo pb-3 px-1 cursor-pointer flex items-center gap-1.5">
                <Home className="h-4 w-4" /> Alquileres de Cuartos
              </span>
              <span className="hover:text-guindo pb-3 px-1 cursor-pointer flex items-center gap-1.5 transition-colors" onClick={() => setIsChatOpen(true)}>
                <MessageCircle className="h-4 w-4" /> Hablar con Maki IA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              
              {/* Search input field */}
              <div className="md:col-span-4 text-left">
                <label className="text-[10px] font-black tracking-wider text-plomo uppercase block mb-1">Buscar Zona / Calle</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Ej. San Blas, Carmen Alto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50"
                  />
                </div>
              </div>

              {/* Neighborhood select */}
              <div className="md:col-span-3 text-left">
                <label className="text-[10px] font-black tracking-wider text-plomo uppercase block mb-1">Barrio (Ayacucho)</label>
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  <option value="All">Todos los barrios</option>
                  {neighborhoods.slice(1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Room type select */}
              <div className="md:col-span-3 text-left">
                <label className="text-[10px] font-black tracking-wider text-plomo uppercase block mb-1">Tipo de Cuarto</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Massive action button */}
              <div className="md:col-span-2 pt-4 md:pt-0">
                <button
                  onClick={() => {
                    document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full bg-guindo text-white py-4 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span>Buscar</span>
                </button>
              </div>

            </div>

          </div>

          {/* Quick trust metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4 text-xs font-semibold text-slate-200">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-[#FFD700]" />
              <span>Cero comisiones ocultas</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-[#FFD700]" />
              <span>Verificación con Maki IA</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-[#FFD700]" />
              <span>Ahorra en mototaxis</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-[#FFD700]" />
              <span>Trato directo con dueño</span>
            </div>
          </div>

        </div>
      </section>

      {/* CORE CONTENT LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        
        {/* MASCOT DEBUT & TIP BLOCK */}
        <section className="bg-white p-6 rounded-3xl border border-plomo-light shadow-sm grid md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-3 flex justify-center">
            <div className="relative group">
              <div className="bg-[#F4F3EF] p-3 rounded-2xl border-2 border-guindo shadow-md w-44 aspect-square overflow-hidden shrink-0 relative">
                <img
                  src={makiMascot}
                  alt="Maki Mascot - Guindo and Plomo Hawk"
                  className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 bg-guindo text-white text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider font-mono shadow border border-white">
                Maki Consejero
              </span>
            </div>
          </div>

          <div className="md:col-span-9 space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-guindo/5 border border-guindo/20 px-3 py-1 rounded-full text-xs font-black text-guindo">
              <Sparkles className="h-3.5 w-3.5 text-[#FFD700]" />
              <span>CONSEJOS DE CONVIVENCIA UNIVERSITARIA EN AYACUCHO</span>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                ¿Buscas cuarto por primera vez en Huamanga?
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                ¡No te preocupes, hermano Huamanguino! He preparado estos tips de seguridad y presupuesto para que tu vida de estudiante en la UNSCH sea tranquila y muy kusi (alegre).
              </p>
            </div>

            {/* Quick interactive tips tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {MACOT_TIPS.map((tip, idx) => (
                <button
                  key={tip.id}
                  onClick={() => setActiveTipIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer flex flex-col justify-between h-20 ${
                    activeTipIndex === idx
                      ? "bg-guindo text-white border-guindo shadow-md"
                      : "bg-[#F8F9FA] text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="block text-[10px] uppercase font-black tracking-wider opacity-85">
                    {tip.category === "safety" ? "Seguridad" : tip.category === "budget" ? "Presupuesto" : tip.category === "location" ? "Zona" : "Estudio"}
                  </span>
                  <span className="block text-xs font-extrabold mt-1 line-clamp-1">{tip.title}</span>
                </button>
              ))}
            </div>

            {/* Current Selected Tip content */}
            <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#F0ECE3] text-xs text-slate-600 mt-2 relative overflow-hidden">
              <p className="font-extrabold text-guindo text-sm mb-1">
                📌 {MACOT_TIPS[activeTipIndex].title}
              </p>
              <p className="leading-relaxed text-slate-600 italic">
                "{MACOT_TIPS[activeTipIndex].message}"
              </p>
            </div>

          </div>

        </section>

        {/* SLIDER / DRAGGABLE SECTION - "Habitaciones Disponibles" */}
        <section id="listings-section" className="space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-guindo animate-pulse"></span>
                <span className="text-xs font-black tracking-widest text-guindo uppercase">ALQUILERES RECOMENDADOS</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
                <Home className="h-6 w-6 text-guindo" />
                <span>Habitaciones Disponibles</span>
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Mostrando <span className="font-bold text-guindo">{filteredListings.length} habitaciones</span> de {listings.length} totales en la base de datos de YachakuqWasi.
              </p>
            </div>

            {/* Slider Navigation controls & Progress bar */}
            {filteredListings.length > 0 && (
              <div className="flex items-center gap-3 self-end md:self-center">
                
                {/* Scroll Indicator */}
                <div className="hidden sm:flex items-center gap-2 mr-2">
                  <span className="text-[10px] font-mono text-slate-400">Progreso</span>
                  <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-guindo h-full transition-all duration-150" 
                      style={{ width: `${Math.max(8, scrollProgress)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Slider trigger arrows */}
                <button
                  onClick={() => scrollSlider("left")}
                  className="bg-white border border-slate-200 p-2.5 rounded-xl hover:border-guindo hover:text-guindo active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Deslizar a la izquierda"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => scrollSlider("right")}
                  className="bg-white border border-slate-200 p-2.5 rounded-xl hover:border-guindo hover:text-guindo active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Deslizar a la derecha"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>

          {/* MAIN DRAGGABLE SCROLL CONTAINER */}
          <div className="relative">
            
            {/* Left and Right ambient shadows to hint scrolling */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#F8F9FA] to-transparent pointer-events-none z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F8F9FA] to-transparent pointer-events-none z-10"></div>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto pb-6 pt-2 px-1 snap-x snap-mandatory scroll-smooth scrollbar-none animate-fade-in"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {filteredListings.length === 0 ? (
                <div className="w-full bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-4">
                  <Compass className="h-12 w-12 text-slate-300 mx-auto stroke-1" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-700">No encontramos habitaciones con esos filtros</h4>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      Intenta restablecer tus filtros o buscar en todos los barrios. ¡Maki tiene otras recomendaciones listas!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedNeighborhood("All");
                      setSelectedType("All");
                      setMaxPrice(550);
                      setMaxMinutes(15);
                    }}
                    className="bg-guindo text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-guindo-dark transition-all cursor-pointer"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                filteredListings.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedListing(room)}
                    className="w-[290px] sm:w-[340px] shrink-0 bg-white rounded-2xl border border-slate-200 hover:border-guindo shadow-sm hover:shadow-lg transition-all cursor-pointer snap-start overflow-hidden group flex flex-col justify-between"
                  >
                    
                    {/* Top image block */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={room.images[0]}
                        alt={room.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Tags layer */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                        {room.verifiedByMaki && (
                          <span className="bg-[#FFC000] text-slate-900 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider font-mono shadow-sm flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-guindo" />
                            <span>Maki Verificado</span>
                          </span>
                        )}
                        <span className="bg-guindo text-white text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide w-fit">
                          {room.type === "room" ? "Cuarto" : room.type === "apartment" ? "Minidepa" : "Compartido"}
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => toggleFavorite(room.id, e)}
                        className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow hover:scale-110 active:scale-90 transition-all z-10"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            favorites.includes(room.id) ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-500"
                          }`}
                        />
                      </button>

                      {/* Neighborhood pill on image corner */}
                      <div className="absolute bottom-2.5 left-2.5 bg-slate-900/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#FFC000]" />
                        <span>{room.neighborhood}</span>
                      </div>
                    </div>

                    {/* Middle details block */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-guindo transition-colors">
                          {room.title}
                        </h4>
                        <p className="text-slate-500 text-[11px] line-clamp-2 mt-1 leading-relaxed">
                          {room.description}
                        </p>
                      </div>

                      {/* Amenities Icons */}
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((a, i) => (
                          <span key={i} className="bg-slate-50 border border-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded font-semibold">
                            {a}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="text-slate-400 text-[9px] font-bold self-center px-1">
                            +{room.amenities.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Bottom price and distance block */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                          <Clock className="h-3 w-3 text-guindo" />
                          <span>A {room.distanceToUnschMinutes} min caminando</span>
                        </span>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Costo mensual</span>
                          <span className="text-sm font-black text-guindo font-mono">
                            S/. {room.pricePen} <span className="text-[10px] font-bold text-slate-400">PEN</span>
                          </span>
                        </div>
                      </div>

                      {/* QUICK CONTACT ACTION BAR */}
                      <div className="pt-3 border-t border-slate-100 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
                        {/* Call button */}
                        <a
                          href={`tel:${room.contactPhone}`}
                          className="flex-1 bg-guindo hover:bg-guindo-dark text-white text-[11px] font-black py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer text-center"
                        >
                          <Phone className="h-3 w-3 text-[#FFD700] shrink-0" />
                          <span>Llamar</span>
                        </a>

                        {/* WhatsApp button */}
                        <a
                          href={`https://wa.me/51${room.contactPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(room.landlordName)},%20vengo%20del%20portal%20Alquiler%20UNSCH%20y%20estoy%20muy%20interesado%20en%20su%20alquiler%20en%20${encodeURIComponent(room.neighborhood)}%20(${encodeURIComponent(room.address)}).%20¿Sigue%20disponible?`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer text-center"
                        >
                          <svg className="h-3.5 w-3.5 fill-white shrink-0" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          <span>WhatsApp</span>
                        </a>
                      </div>

                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 font-medium">
            💡 <span className="font-bold text-guindo">Tip:</span> Desliza con libertad hacia la derecha e izquierda para explorar todos los cuartos disponibles.
          </p>

        </section>

        {/* MAP & BUDGET CALCULATOR BENTO GRID */}
        <section className="grid lg:grid-cols-12 gap-8 pt-4">
          
          {/* MAP VISUALIZER BENTO (7 COLS) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Map className="h-5 w-5 text-guindo" />
                  <span>Geolocalización de Alojamientos</span>
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Encuentra los cuartos en el mapa de Ayacucho con relación a la UNSCH
                </p>
              </div>
              <span className="bg-guindo/10 text-guindo text-[10px] font-black px-2.5 py-1 rounded-lg">
                Ayacucho
              </span>
            </div>

            {/* Map Container */}
            <div className="bg-[#EFECE5] rounded-2xl h-80 border border-slate-200 relative overflow-hidden">
              {/* Map grid lines */}
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute left-[20%] top-0 bottom-0 w-2 bg-slate-300"></div>
                <div className="absolute left-[50%] top-0 bottom-0 w-2 bg-slate-300"></div>
                <div className="absolute left-[80%] top-0 bottom-0 w-2 bg-slate-300"></div>
                <div className="absolute top-[35%] left-0 right-0 h-2 bg-slate-300"></div>
                <div className="absolute top-[70%] left-0 right-0 h-2 bg-slate-300"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#d3cfc7_20%,transparent_20%)] [background-size:14px_14px]"></div>
              </div>

              {/* UNSCH Landmark Centerpiece */}
              <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                <div className="bg-guindo border-2 border-white text-white p-2 rounded-2xl shadow-xl flex flex-col items-center gap-1">
                  <div className="h-8 w-8 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                    <img src={unschLogoIcon} alt="UNSCH Logo Map" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest font-mono px-1 uppercase text-[#FFD700]">CAMPUS UNSCH</span>
                </div>
              </div>

              {/* Dynamic Path to UNSCH */}
              {selectedListing && (
                (() => {
                  const selectedDeoverlapped = deoverlappedListings.find(l => l.id === selectedListing.id);
                  if (selectedDeoverlapped) {
                    return (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <line
                          x1={`${selectedDeoverlapped.adjX}%`}
                          y1={`${selectedDeoverlapped.adjY}%`}
                          x2="50%"
                          y2="33.3%"
                          stroke="#800020"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="animate-pulse"
                        />
                      </svg>
                    );
                  }
                  return null;
                })()
              )}

              {/* Pin mapping */}
              {deoverlappedListings.map((room) => {
                const isSelected = selectedListing?.id === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedListing(room)}
                    className={`absolute p-1 -translate-x-1/2 -translate-y-1/2 hover:z-20 transition-all cursor-pointer group ${isSelected ? "z-30" : ""}`}
                    style={{ left: `${room.adjX}%`, top: `${room.adjY}%` }}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow border border-white transition-all scale-100 group-hover:scale-105 font-mono ${
                        isSelected 
                          ? "bg-[#FFC000] text-slate-900 border-[#FFD700]" 
                          : "bg-guindo text-white group-hover:bg-plomo-dark"
                      }`}>
                        S/.{room.pricePen}
                      </span>
                      <MapPin className={`h-4.5 w-4.5 transition-all scale-100 group-hover:scale-110 ${
                        isSelected 
                          ? "text-[#FFC000] drop-shadow-[0_0_8px_rgba(255,192,0,0.8)]" 
                          : "text-guindo group-hover:text-plomo-dark"
                      }`} />
                    </div>
                  </button>
                );
              })}

              <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-xl text-[10px] text-slate-500 font-bold border border-slate-100 flex items-center justify-between">
                <span>📍 Toca los pines para ver el cuarto en el mapa</span>
                <span className="text-guindo">YachakuqWasi</span>
              </div>
            </div>

          </div>

          {/* BUDGET & ROOMMATE FINDER TABBED BENTO (5 COLS) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[480px]">
            
            <div className="space-y-4">
              {/* Custom tabs */}
              <div className="flex border-b border-slate-100 pb-3 gap-4 text-xs font-bold text-slate-400">
                <button
                  onClick={() => setActiveBentoTab("budget")}
                  className={`pb-2 px-1 cursor-pointer flex items-center gap-1.5 transition-all ${
                    activeBentoTab === "budget" ? "text-guindo border-b-2 border-guindo font-black" : "hover:text-guindo"
                  }`}
                >
                  <Calculator className="h-4 w-4" /> Presupuesto UNSCH
                </button>
                <button
                  onClick={() => setActiveBentoTab("roommate")}
                  className={`pb-2 px-1 cursor-pointer flex items-center gap-1.5 transition-all relative ${
                    activeBentoTab === "roommate" ? "text-guindo border-b-2 border-guindo font-black" : "hover:text-guindo"
                  }`}
                >
                  <Users className="h-4 w-4 text-guindo" /> Maki Matcher
                  <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1 py-0.5 rounded ml-1 animate-pulse">¡Nuevo!</span>
                </button>
              </div>

              {activeBentoTab === "budget" ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="bg-guindo/5 p-2 rounded-xl text-guindo">
                      <Calculator className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Calculadora de Presupuesto Estudiantil</h3>
                      <p className="text-slate-400 text-[10px]">Estima tus costos mensuales para estudiar en Ayacucho</p>
                    </div>
                  </div>

                  <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 font-bold">
                        <span>Alquiler de cuarto:</span>
                        <span className="font-mono text-guindo">S/. {rentCost} PEN</span>
                      </div>
                      <input
                        type="range"
                        min="150"
                        max="450"
                        step="10"
                        value={rentCost}
                        onChange={(e) => setRentCost(Number(e.target.value))}
                        className="w-full accent-guindo cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 font-bold">
                        <span>Alimentación mensual:</span>
                        <span className="font-mono text-slate-800">S/. {foodCost} PEN</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="350"
                        step="10"
                        value={foodCost}
                        onChange={(e) => setFoodCost(Number(e.target.value))}
                        className="w-full accent-guindo cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 font-bold">
                        <span>Transporte (Mototaxis):</span>
                        <span className="font-mono text-slate-800">S/. {transportCost} PEN</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={transportCost}
                        onChange={(e) => setTransportCost(Number(e.target.value))}
                        className="w-full accent-guindo cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 font-bold">
                        <span>Copias y Libros:</span>
                        <span className="font-mono text-slate-800">S/. {studyCost} PEN</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="120"
                        step="5"
                        value={studyCost}
                        onChange={(e) => setStudyCost(Number(e.target.value))}
                        className="w-full accent-guindo cursor-pointer"
                      />
                    </div>

                  </div>

                  {/* Total display */}
                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Costo Estimado</span>
                        <span className="text-xl font-black text-guindo font-mono">
                          S/. {totalBudget} <span className="text-xs font-bold text-slate-500">PEN / Mes</span>
                        </span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase font-mono">
                        Suma total
                      </span>
                    </div>

                    {/* Maki mascot direct quote in calculator */}
                    <div className="bg-[#FDFBF7] border border-[#FFC000]/30 p-3 rounded-2xl text-[11px] text-slate-600 flex items-start gap-2">
                      <div className="shrink-0 h-7 w-7 rounded-full overflow-hidden border border-guindo bg-white">
                        <img src={makiMascot} alt="Maki mini" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-extrabold text-guindo text-[10px] mb-0.5">Maki aconseja:</p>
                        <p className="leading-tight text-slate-600 font-medium">{getMakiBudgetComment()}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* MAKI MATCHER ROOMMATE QUIZ CONTENT */
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-guindo/5 p-2 rounded-xl text-guindo">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Maki Matcher (Filtro de Roommate)</h3>
                      <p className="text-slate-400 text-[10px]">Encuentra compañeros ideales para dividir gastos</p>
                    </div>
                  </div>

                  {roommateQuizStep === 0 && (
                    <div className="space-y-4 text-center py-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="h-14 w-14 bg-guindo/5 rounded-full flex items-center justify-center mx-auto text-guindo">
                        <Smile className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-800">¿Cansado de buscar alquiler solo?</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                          Responde 4 preguntas sencillas sobre tus hábitos de estudio y convivencia. Maki buscará perfiles compatibles contigo de la UNSCH.
                        </p>
                      </div>
                      <button
                        onClick={() => setRoommateQuizStep(1)}
                        className="bg-guindo text-white text-xs font-black px-5 py-2.5 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
                      >
                        Comenzar Test de Maki
                      </button>
                    </div>
                  )}

                  {roommateQuizStep === 1 && (
                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>PREGUNTA 1 DE 4</span>
                        <span>Estudio</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800">¿Cómo estudias mejor para los parciales de la UNSCH?</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setRoommateAnswers(prev => ({ ...prev, study: "silent" }));
                            setRoommateQuizStep(2);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-guindo hover:bg-guindo/5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          🤫 Silencio absoluto (Biblioteca o cuarto cerrado)
                        </button>
                        <button
                          onClick={() => {
                            setRoommateAnswers(prev => ({ ...prev, study: "music" }));
                            setRoommateQuizStep(2);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-guindo hover:bg-guindo/5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          🎵 Con música o ruido de fondo (Me inspira)
                        </button>
                      </div>
                    </div>
                  )}

                  {roommateQuizStep === 2 && (
                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>PREGUNTA 2 DE 4</span>
                        <span>Horarios</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800">¿Cuál es tu horario habitual de sueño / actividad?</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setRoommateAnswers(prev => ({ ...prev, schedule: "early" }));
                            setRoommateQuizStep(3);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-guindo hover:bg-guindo/5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          🌅 Madrugador(a) (Me levanto temprano y duermo temprano)
                        </button>
                        <button
                          onClick={() => {
                            setRoommateAnswers(prev => ({ ...prev, schedule: "night" }));
                            setRoommateQuizStep(3);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-guindo hover:bg-guindo/5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          🦉 Búho nocturno (Me concentro de noche y duermo tarde)
                        </button>
                      </div>
                    </div>
                  )}

                  {roommateQuizStep === 3 && (
                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>PREGUNTA 3 DE 4</span>
                        <span>Orden</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800">¿Qué tan estricto(a) eres con el orden del cuarto?</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setRoommateAnswers(prev => ({ ...prev, order: "tidy" }));
                            setRoommateQuizStep(4);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-guindo hover:bg-guindo/5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          ✨ Súper ordenado(a) (Limpio todo de inmediato)
                        </button>
                        <button
                          onClick={() => {
                            setRoommateAnswers(prev => ({ ...prev, order: "relaxed" }));
                            setRoommateQuizStep(4);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-guindo hover:bg-guindo/5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          🌾 Relajado(a) (Limpio regularmente, sin presiones)
                        </button>
                      </div>
                    </div>
                  )}

                  {roommateQuizStep === 4 && (
                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>PREGUNTA 4 DE 4</span>
                        <span>Social</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800">¿Cómo prefieres pasar tus fines de semana libres?</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            const finalAns = { ...roommateAnswers, social: "quiet" };
                            setRoommateAnswers(finalAns);
                            setRoommateQuizStep(5);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-guindo hover:bg-guindo/5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          🏡 Tranquilo(a) (Ver películas, leer o visitar familia)
                        </button>
                        <button
                          onClick={() => {
                            const finalAns = { ...roommateAnswers, social: "social" };
                            setRoommateAnswers(finalAns);
                            setRoommateQuizStep(5);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-guindo hover:bg-guindo/5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          ⚽ Activo (Deportes, paseos por Huamanga, reuniones)
                        </button>
                      </div>
                    </div>
                  )}

                  {roommateQuizStep === 5 && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Result card */}
                      <div className="bg-gradient-to-br from-guindo to-[#300a0a] text-white p-4 rounded-2xl shadow-md border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono tracking-widest text-[#FFD700] uppercase font-black">INSIGNIA MAKI</span>
                          <Award className="h-4 w-4 text-[#FFD700]" />
                        </div>
                        <h4 className="text-xs font-black tracking-tight text-white uppercase">
                          Tu Perfil: <span className="text-[#FFD700]">{getRoommateProfile().title}</span>
                        </h4>
                        <p className="text-[10px] text-slate-200 leading-relaxed font-medium">
                          {getRoommateProfile().desc}
                        </p>
                      </div>

                      {/* Roommate Matches List */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">COMPAÑEROS RECOMENDADOS (UNSCH)</span>
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {getCompatibleRoommates().map((mate, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-800 text-[11px]">{mate.name}</span>
                                  <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 py-0.2 rounded font-mono font-black">{mate.match} Match</span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium block">{mate.career}</span>
                                <p className="text-[10px] text-slate-600 italic font-medium leading-tight">"{mate.note}"</p>
                              </div>
                              <button
                                onClick={() => {
                                  alert(`¡Genial! Puedes contactar a ${mate.name} al celular ${mate.phone}. Menciona que lo viste en YachakuqWasi.`);
                                }}
                                className="bg-guindo hover:bg-guindo-dark text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition-all cursor-pointer"
                              >
                                Contactar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setRoommateQuizStep(0);
                            setRoommateAnswers({ study: "", schedule: "", order: "", social: "" });
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] py-2 rounded-xl font-bold transition-all cursor-pointer text-center"
                        >
                          Repetir Test
                        </button>
                        <button
                          onClick={() => {
                            setActiveBentoTab("budget");
                          }}
                          className="flex-1 bg-guindo text-white text-[11px] py-2 rounded-xl font-black transition-all cursor-pointer text-center hover:bg-opacity-90 shadow-sm"
                        >
                          Ir a Presupuesto
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Subtle disclaimer */}
            <p className="text-[9px] text-slate-400 text-center font-medium pt-3 border-t border-slate-100">
              ⚡ Proyecto YachakuqWasi: Diseñado para conectar kusi-kusi a estudiantes de Huamanga.
            </p>
          </div>

        </section>

        {/* TESTIMONIALS & REVIEWS SECTION */}
        <section className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-black tracking-widest text-guindo uppercase block">TESTIMONIOS ESTUDIANTILES</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ¿Qué opinan otros estudiantes de la UNSCH?
            </h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Lee la experiencia de compañeros de diversas facultades que consiguieron su cuarto ideal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STUDENT_TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-[#F8F9FA] p-5 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <div className="flex gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-[#FFC000] text-[#FFC000]" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed italic">
                    "{t.content}"
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <div className="bg-guindo/10 h-8 w-8 rounded-full flex items-center justify-center font-bold text-guindo text-xs shrink-0 font-mono">
                    {t.studentName.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{t.studentName}</h5>
                    <span className="text-[10px] text-slate-400 font-medium block">Facultad de {t.faculty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        </main>
      </>
    ) : (
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Dashboard Container Router */}
          {!currentUser ? (
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 text-center max-w-2xl mx-auto shadow-sm space-y-6">
              <div className="relative h-20 w-20 mx-auto">
                <div className="h-20 w-20 rounded-full border-4 border-guindo/20 bg-[#FDFBF7] shadow-lg overflow-hidden flex items-center justify-center p-1">
                  <img src={makiMascot} alt="Maki la mascota" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Acceso Privado al Portal UNSCH</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                  ¡Allillanchu! Para ver tu panel personalizado de última generación, subir tus credenciales o moderar anuncios, debes iniciar sesión o usar un preset de demostración.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-4 text-left">
                {/* Estudiante demo login card */}
                <button
                  onClick={() => {
                    const studentUser: UserAccount = {
                      name: "Rubén Mendoza",
                      email: "ruben.mendoza@unsch.edu.pe",
                      role: "student",
                      faculty: "Facultad de Ingeniería de Minas, Geología y Metalurgia",
                      career: "Ingeniería de Minas",
                      isVerified: true,
                      verificationStatus: "approved"
                    };
                    setCurrentUser(studentUser);
                    localStorage.setItem("yachakuqwasi_user", JSON.stringify(studentUser));
                    setChatMessages(prev => [
                      ...prev,
                      { sender: "maki", text: "¡Hola Rubén! He cargado tu panel de Estudiante UNSCH con tu carnet digital y chat directo. ¡Pruébalo!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                    ]);
                  }}
                  className="p-4 rounded-2xl border border-amber-200 hover:border-amber-400 bg-amber-50/30 text-left transition-all hover:shadow-md cursor-pointer group hover:-translate-y-0.5"
                >
                  <span className="text-lg mb-2 block">🎓</span>
                  <h4 className="font-extrabold text-xs text-slate-800">Estudiante Demo</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">Revisa tu carnet digital, calcula tu presupuesto interactivo y chatea con dueños.</p>
                </button>

                {/* Arrendador demo login card */}
                <button
                  onClick={() => {
                    const landlordUser: UserAccount = {
                      name: "Sra. Teodora Quispe",
                      email: "teodora.quispe@gmail.com",
                      role: "landlord",
                      isVerified: true,
                      verificationStatus: "approved"
                    };
                    setCurrentUser(landlordUser);
                    localStorage.setItem("yachakuqwasi_user", JSON.stringify(landlordUser));
                  }}
                  className="p-4 rounded-2xl border border-sky-200 hover:border-sky-400 bg-sky-50/30 text-left transition-all hover:shadow-md cursor-pointer group hover:-translate-y-0.5"
                >
                  <span className="text-lg mb-2 block">🏡</span>
                  <h4 className="font-extrabold text-xs text-slate-800">Arrendador Demo</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">Gestiona tus cuartos, revisa tus ganancias en soles y chatea con interesados.</p>
                </button>

                {/* Administrador demo login card */}
                <button
                  onClick={() => {
                    const adminUser: UserAccount = {
                      name: "Steve Ovalle (Admin)",
                      email: "steve.ovalle.27@unsch.edu.pe",
                      role: "admin",
                      isVerified: true,
                      verificationStatus: "approved"
                    };
                    setCurrentUser(adminUser);
                    localStorage.setItem("yachakuqwasi_user", JSON.stringify(adminUser));
                  }}
                  className="p-4 rounded-2xl border border-rose-200 hover:border-rose-400 bg-rose-50/30 text-left transition-all hover:shadow-md cursor-pointer group hover:-translate-y-0.5"
                >
                  <span className="text-lg mb-2 block">⚙️</span>
                  <h4 className="font-extrabold text-xs text-slate-800">Administrador Demo</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">Modera anuncios, aprueba credenciales, audita registros y controla usuarios.</p>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-center gap-4">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-guindo text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all cursor-pointer shadow-sm"
                >
                  Ingresar con mi cuenta real
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Welcome Title */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-guindo animate-pulse"></span>
                    <span className="text-[10px] font-black text-guindo uppercase tracking-wider font-mono">
                      Portal del {currentUser.role === 'student' ? 'Estudiante' : currentUser.role === 'admin' ? 'Administrador del Sistema' : 'Arrendatario de Viviendas'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex flex-wrap items-center gap-2">
                    <span>¡Allillanchu, {currentUser.name}!</span>
                    {currentUser.isVerified && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 border border-amber-200 shadow-xs">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                        <span>Verificado por Maki</span>
                      </span>
                    )}
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">
                    {currentUser.role === "student" && "Gestiona tu vida universitaria: carnet digital, roommate matching, presupuesto mensual e inquilinatos."}
                    {currentUser.role === "landlord" && "Administra tus alquileres activos, monitorea las solicitudes de alumnos e inspecciona tus ingresos."}
                    {currentUser.role === "admin" && "Controlador maestro: aprueba identidades, modera anuncios, audita registros y controla usuarios."}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 self-start md:self-center bg-white p-2 border border-slate-200 rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Sesión actual:</span>
                  <span className="text-[10px] font-black text-slate-800 capitalize">
                    {currentUser.role === "student" ? "Estudiante UNSCH" : currentUser.role === "landlord" ? "Propietario / Arrendador" : "Admin Principal"}
                  </span>
                </div>
              </div>

              {/* DASHBOARDS CONTROLLERS BASED ON ROLE */}
              {currentUser.role === "student" && renderStudentDashboard()}
              {currentUser.role === "landlord" && renderLandlordDashboard()}
              {currentUser.role === "admin" && renderAdminDashboard()}
            </div>
          )}
        </main>
      )}

      {/* COMPACT INSTITUTIONAL FOOTER */}
      <footer className="bg-guindo text-white py-12 px-4 border-t-8 border-plomo">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="grid md:grid-cols-12 gap-8 items-center pb-8 border-b border-white/10">
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-white/10 p-0.5 shadow-sm border border-white/10 flex items-center justify-center shrink-0">
                  <img src={unschLogoIcon} alt="UNSCH Logo Footer" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
                <h4 className="text-lg font-black tracking-tight text-white">
                  YachakuqWasi (La Casa del Estudiante)
                </h4>
              </div>
              <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
                Portal universitario independiente diseñado exclusivamente para conectar a los estudiantes de la UNSCH con los mejores propietarios de habitaciones y minidepartamentos de Ayacucho.
              </p>
            </div>

            <div className="md:col-span-5 md:text-right space-y-2">
              <span className="text-[9px] font-mono bg-white/10 text-[#FFD700] px-3 py-1.5 rounded-lg inline-block uppercase font-black tracking-widest">
                Sumaq Yachay • Ayacucho, Perú
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-medium">
            <p>© 2026 YachakuqWasi. Proyecto de apoyo al estudiante de la UNSCH. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <span>Mascota Oficial: Maki</span>
              <span>•</span>
              <span>Colores Guindo y Plomo</span>
            </div>
          </div>

        </div>
      </footer>

      {/* STANDARD LOGIN / SIGN UP MODAL */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative z-10 border border-slate-100 overflow-hidden"
            >
              
              {/* Header */}
              <div className="text-center space-y-3 mb-6">
                <div className="relative h-16 w-16 mx-auto">
                  <div className="h-16 w-16 rounded-full border-2 border-guindo/20 bg-[#FDFBF7] shadow-md overflow-hidden flex items-center justify-center p-0.5">
                    <img src={makiMascot} alt="Maki la mascota" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" title="Maki está en línea"></span>
                </div>
                <h3 className="text-xl font-extrabold text-[#3b0d0d] tracking-tight">
                  {authMode === "login" ? "Iniciar Sesión con Maki" : "Crear Cuenta con Maki"}
                </h3>
                <p className="text-slate-400 text-xs">
                  {authMode === "login" ? "Ingresa para gestionar tus favoritos y hablar con Maki" : "Regístrate en YachakuqWasi de forma totalmente gratuita"}
                </p>
              </div>

              {/* Form body */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                
                {authError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-xs font-semibold rounded-r">
                    ⚠️ {authError}
                  </div>
                )}

                {authMode === "signup" && (
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Ej. Juan Pérez Quispe"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Correo Electrónico (Email)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="email"
                      placeholder="ejemplo@unsch.edu.pe"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
                      required
                    />
                  </div>
                </div>

                {authMode === "login" && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">⚡ Cuentas de Prueba Pre-configuradas:</span>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthEmail("estudiante_demo@unsch.edu.pe");
                          setAuthPassword("EstudianteDemo2026!");
                        }}
                        className="text-[11px] font-bold text-slate-700 hover:text-guindo flex items-center justify-between hover:bg-white p-1.5 rounded-lg border border-transparent hover:border-slate-100 transition-all cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-1">🎓 <span>Estudiante Demo</span></span>
                        <span className="font-mono text-[9px] text-slate-400">click para auto-rellenar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthEmail("arrendador_demo@gmail.com");
                          setAuthPassword("ArrendadorDemo2026!");
                        }}
                        className="text-[11px] font-bold text-slate-700 hover:text-guindo flex items-center justify-between hover:bg-white p-1.5 rounded-lg border border-transparent hover:border-slate-100 transition-all cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-1">🏡 <span>Arrendador Demo</span></span>
                        <span className="font-mono text-[9px] text-slate-400">click para auto-rellenar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthEmail("admin_demo@alquilerunsch.pe");
                          setAuthPassword("AdminDemo2026!");
                        }}
                        className="text-[11px] font-bold text-slate-700 hover:text-guindo flex items-center justify-between hover:bg-white p-1.5 rounded-lg border border-transparent hover:border-slate-100 transition-all cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-1">⚙️ <span>Administrador Demo</span></span>
                        <span className="font-mono text-[9px] text-slate-400">click para auto-rellenar</span>
                      </button>
                    </div>
                  </div>
                )}

                {authMode === "signup" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Tipo de Usuario</label>
                        <select
                          value={authRole}
                          onChange={(e) => setAuthRole(e.target.value as any)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="student">Estudiante</option>
                          <option value="landlord">Arrendador</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Teléfono Móvil</label>
                        <input
                          type="tel"
                          placeholder="Ej. 966123456"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-medium"
                        />
                      </div>

                    </div>

                    {authRole === "student" && (
                      <div className="space-y-3">
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Facultad Académica (UNSCH)</label>
                          <select
                            value={authFaculty}
                            onChange={(e) => {
                              const selectedFac = e.target.value;
                              setAuthFaculty(selectedFac);
                              const relatedCareers = UNSCH_ACADEMIC_MAP[selectedFac] || [];
                              if (relatedCareers.length > 0) {
                                setAuthCareer(relatedCareers[0]);
                              }
                            }}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                          >
                            {Object.keys(UNSCH_ACADEMIC_MAP).map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Carrera Profesional</label>
                          <select
                            value={authCareer}
                            onChange={(e) => setAuthCareer(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                          >
                            {(UNSCH_ACADEMIC_MAP[authFaculty] || []).map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  className="w-full bg-guindo text-white py-3 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer mt-2"
                >
                  <span>{authMode === "login" ? "Ingresar" : "Registrar Datos Estándar"}</span>
                </button>

              </form>

              {/* Toggle switch */}
              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 mt-6">
                <span>
                  {authMode === "login" ? "¿No tienes una cuenta aún?" : "¿Ya estás registrado en YachakuqWasi?"}
                </span>{" "}
                <button
                  onClick={() => {
                    setAuthError("");
                    setAuthMode(authMode === "login" ? "signup" : "login");
                  }}
                  className="text-guindo font-black underline hover:text-guindo-dark cursor-pointer ml-1"
                >
                  {authMode === "login" ? "Crear cuenta ahora" : "Inicia sesión aquí"}
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* CHAT WITH MAKI SLIDE DRAWER */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between border-l border-slate-200"
            >
              
              {/* Header */}
              <div className="bg-guindo text-white px-5 py-4 flex items-center justify-between border-b-4 border-plomo">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-white border-2 border-slate-200 shrink-0">
                    <img src={makiMascot} alt="Maki IA Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                      <span>Maki, el Halcón Consejero</span>
                      <span className="bg-emerald-500 h-2 w-2 rounded-full inline-block animate-pulse"></span>
                    </h4>
                    <span className="text-[10px] text-slate-300 block font-mono">IA con Vibras de Huamanga</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 max-w-[85%] ${
                      msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    {msg.sender === "maki" && (
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-white border border-guindo shrink-0 flex items-center justify-center text-[10px] font-black text-guindo font-mono">
                        M
                      </div>
                    )}

                    <div className="space-y-1">
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          msg.sender === "user"
                            ? "bg-guindo text-white rounded-tr-none"
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 block font-mono text-right px-1">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}

                {isMakiTyping && (
                  <div className="flex gap-2.5 max-w-[85%] mr-auto">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-white border border-guindo shrink-0 flex items-center justify-center text-[10px] font-black text-guindo font-mono">
                      M
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-xs text-slate-500 shadow-sm flex items-center gap-1.5">
                      <span className="font-bold text-guindo">Maki está pensando</span>
                      <span className="flex gap-0.5">
                        <span className="h-1.5 w-1.5 bg-guindo rounded-full animate-bounce"></span>
                        <span className="h-1.5 w-1.5 bg-guindo rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="h-1.5 w-1.5 bg-guindo rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Escribe tu pregunta sobre alquileres..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-guindo font-medium text-slate-700"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-guindo text-white p-2.5 rounded-xl hover:bg-opacity-90 transition-all cursor-pointer shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* SELECTED LISTING DETAIL MODAL */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedListing(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative z-10 border border-slate-100 overflow-hidden"
            >
              
              {/* Image Banner / Gallery de fotos */}
              <div className="relative h-48 -mx-6 -mt-6 bg-slate-100 overflow-hidden mb-4">
                <img
                  src={selectedListing.images[galleryIndex] ?? selectedListing.images[0]}
                  alt={`${selectedListing.title} - foto ${galleryIndex + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {selectedListing.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setGalleryIndex((i) => (i === 0 ? selectedListing.images.length - 1 : i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm p-1 rounded-full shadow-md text-slate-700 transition-colors cursor-pointer z-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryIndex((i) => (i === selectedListing.images.length - 1 ? 0 : i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm p-1 rounded-full shadow-md text-slate-700 transition-colors cursor-pointer z-10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                      {selectedListing.images.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setGalleryIndex(i)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            i === galleryIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                          }`}
                        />
                      ))}
                    </div>

                    <span className="absolute bottom-2 right-3 bg-slate-900/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10">
                      {galleryIndex + 1}/{selectedListing.images.length}
                    </span>
                  </>
                )}

                <div className="absolute top-4 left-4 flex gap-2 z-10">
                  {selectedListing.verifiedByMaki && (
                    <span className="bg-[#FFC000] text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono shadow">
                      Maki Verificado
                    </span>
                  )}
                  <span className="bg-guindo text-white text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide">
                    {selectedListing.type === "room" ? "Habitación" : "Departamento"}
                  </span>
                </div>

                {/* Close Button on image corner */}
                <button
                  onClick={() => setSelectedListing(null)}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-md text-slate-700 hover:text-slate-950 transition-colors cursor-pointer z-10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Thumbnail strip: navegacion rapida entre todas las fotos */}
              {selectedListing.images.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mt-2 mb-2">
                  {selectedListing.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`shrink-0 h-10 w-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        i === galleryIndex ? "border-guindo" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}

              {/* Title & Neighborhood */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs font-bold text-guindo">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{selectedListing.neighborhood} • {selectedListing.address}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {selectedListing.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-slate-600 text-xs leading-relaxed mt-3">
                {selectedListing.description}
              </p>

              {/* Proximity / Cost stats */}
              <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Cercanía a la UNSCH</span>
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-guindo" />
                    <span>A {selectedListing.distanceToUnschMinutes} min caminando</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Costo Mensual</span>
                  <span className="text-sm font-black text-guindo font-mono">
                    S/. {selectedListing.pricePen} <span className="text-xs font-bold text-slate-500">PEN</span>
                  </span>
                </div>
              </div>

              {/* GOOGLE MAPS ROUTE & DISTANCE */}
              <div className="mt-4 p-4 rounded-2xl bg-[#FDFBF7] border border-[#F0ECE3] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Map className="h-4 w-4 text-guindo animate-pulse" />
                    <span className="text-[10px] text-guindo font-black uppercase tracking-wider">Ubicación y Recorrido de Google Maps</span>
                  </div>
                  <span className="bg-amber-100 text-amber-900 font-extrabold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Compass className="h-3 w-3 text-amber-700 animate-spin-slow" />
                    <span>A {selectedListing.distanceToUnschMinutes} min caminando</span>
                  </span>
                </div>

                {/* Google Maps Embed Iframe with real-world query */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner h-40 bg-slate-100">
                  <iframe
                    title="Ubicación en Google Maps"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedListing.address + ", " + selectedListing.neighborhood + ", Ayacucho, Peru")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Google Maps Directions Action Link */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedListing.address + ", " + selectedListing.neighborhood + ", Ayacucho, Peru")}&destination=UNSCH,+Ayacucho,+Peru&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 py-2 px-3 rounded-xl text-[11px] font-black tracking-tight flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:bg-slate-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-guindo animate-pulse" />
                    <span>Abrir Recorrido en Google Maps</span>
                  </a>
                </div>

                {/* Maki safe-walking recommendation tip bubble */}
                <div className="bg-[#FFFDF9] border border-guindo/15 p-2.5 rounded-xl text-[10px] text-slate-600 flex items-start gap-2 mt-2">
                  <div className="shrink-0 h-6 w-6 rounded-full overflow-hidden border border-guindo bg-white">
                    <img src={makiMascot} alt="Maki mini" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-extrabold text-guindo text-[9px] block">Maki Consejos de Ruta:</span>
                    <p className="leading-tight text-slate-500 italic">
                      {selectedListing.distanceToUnschMinutes <= 7 
                        ? `¡Excelente wawa! Estás cerquísima de la UNSCH. Ideal para las clases de las 7:00 AM sin tener que correr por Av. Independencia.`
                        : `A ${selectedListing.distanceToUnschMinutes} minutos caminando, es una ruta perfecta para hacer ejercicio diario y ahorrar el presupuesto de mototaxi.`}
                    </p>
                  </div>
                </div>

              </div>

              {/* Amenities List */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Servicios y facilidades</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedListing.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                    >
                      <Check className="h-3 w-3 text-guindo" />
                      <span>{amenity}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact card */}
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Propietario / Arrendatario</span>
                    <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{selectedListing.landlordName}</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Activo hoy</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  {/* Phone Call Button */}
                  <a
                    href={`tel:${selectedListing.contactPhone}`}
                    className="bg-guindo text-white py-2.5 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md flex items-center gap-1.5 cursor-pointer justify-center"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#FFD700]" />
                    <span>Llamar</span>
                  </a>

                  {/* WhatsApp Message Button */}
                  <a
                    href={`https://wa.me/51${selectedListing.contactPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(selectedListing.landlordName)},%20vengo%20del%20portal%20Alquiler%20UNSCH%20y%20estoy%20muy%20interesado%20en%20su%20alquiler%20en%20${encodeURIComponent(selectedListing.neighborhood)}%20(${encodeURIComponent(selectedListing.address)}).%20¿Sigue%20disponible?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md flex items-center gap-1.5 cursor-pointer justify-center"
                  >
                    <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* LANDLORD SUBMISSION MODAL */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative z-10 border border-slate-100 overflow-y-auto max-h-[90vh]"
            >
              
              <div className="text-center space-y-1 mb-5">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                  <Plus className="h-5 w-5 text-guindo" />
                  <span>Publicar Habitación en YachakuqWasi</span>
                </h3>
                <p className="text-slate-400 text-xs">
                  Tu publicación pasará por el filtro rápido de Maki para verificar que es apto para alumnos de la UNSCH
                </p>
              </div>

              {formSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6 animate-bounce" />
                  </div>
                  <h4 className="font-extrabold text-slate-800">¡Tu habitación ha sido registrada con éxito!</h4>
                  <p className="text-slate-500 text-xs max-w-xs mx-auto">
                    Maki ha aprobado automáticamente tu anuncio para que cientos de estudiantes UNSCH lo vean en nuestro mapa interactivo.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Título del Anuncio</label>
                    <input
                      type="text"
                      placeholder="Ej. Cuarto Amoblado a espaldas de la UNSCH"
                      value={newRoom.title}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Tipo de Alquiler</label>
                      <select
                        value={newRoom.type}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="room">Habitación</option>
                        <option value="apartment">Minidepartamento</option>
                        <option value="shared">Espacio Compartido</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Mensualidad (S/. PEN)</label>
                      <input
                        type="number"
                        min="50"
                        max="2000"
                        value={newRoom.pricePen}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, pricePen: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                        required
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Barrio de Ayacucho</label>
                      <select
                        value={newRoom.neighborhood}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, neighborhood: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"
                      >
                        {neighborhoods.slice(1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Minutos caminando a la UNSCH</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={newRoom.distanceToUnschMinutes}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, distanceToUnschMinutes: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                        required
                      />
                    </div>

                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Dirección Exacta</label>
                    <input
                      type="text"
                      placeholder="Ej. Jr. Tres Máscaras 142"
                      value={newRoom.address}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Descripción del Lugar</label>
                    <textarea
                      placeholder="Comenta sobre la iluminación, seguridad, servicios incluidos..."
                      rows={2}
                      value={newRoom.description}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                    />
                  </div>

                  {/* Add amenities widget */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Servicios del cuarto</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. Wi-Fi de fibra, Baño privado"
                        value={amenityInput}
                        onChange={(e) => setAmenityInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddAmenity}
                        className="bg-guindo text-white px-3 py-2 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all cursor-pointer"
                      >
                        Agregar
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {newRoom.amenities.map((item, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold">
                          <span>{item}</span>
                          <button type="button" onClick={() => handleRemoveAmenity(i)} className="text-red-500 hover:text-red-700 font-bold font-mono">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Photo upload widget: arrendador o admin pueden subir varias fotos */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">
                      Fotos de la Habitación ({newRoom.images.length}/{MAX_LISTING_PHOTOS})
                    </label>
                    <p className="text-[10px] text-slate-400 -mt-0.5">
                      Agrega varias fotos (recomendamos más de 3) para que los estudiantes puedan ver el lugar a detalle.
                    </p>

                    <label
                      htmlFor="listing-photo-input"
                      className={`flex items-center justify-center gap-1.5 border-2 border-dashed rounded-xl py-3 text-xs font-bold transition-all ${
                        newRoom.images.length >= MAX_LISTING_PHOTOS
                          ? "border-slate-100 text-slate-300 cursor-not-allowed"
                          : "border-guindo/30 text-guindo hover:bg-guindo/5 cursor-pointer"
                      }`}
                    >
                      <ImagePlus className="h-4 w-4" />
                      <span>Subir fotos</span>
                    </label>
                    <input
                      id="listing-photo-input"
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={newRoom.images.length >= MAX_LISTING_PHOTOS}
                      onChange={(e) => {
                        handleAddImages(e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />

                    {newRoom.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {newRoom.images.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                            <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(i)}
                              className="absolute top-0.5 right-0.5 bg-slate-900/70 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] leading-none font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Nombre del Arrendador</label>
                      <input
                        type="text"
                        placeholder="Ej. Sra. Teodora Quispe"
                        value={newRoom.landlordName}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, landlordName: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">Teléfono Móvil de Contacto</label>
                      <input
                        type="tel"
                        placeholder="Ej. +51 987 654 321"
                        value={newRoom.contactPhone}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, contactPhone: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-guindo text-xs"
                        required
                      />
                    </div>

                  </div>

                  <button
                    type="submit"
                    className="w-full bg-guindo text-white py-3 rounded-xl text-xs font-black hover:bg-guindo-dark transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer mt-2"
                  >
                    <span>Publicar Ahora</span>
                  </button>

                </form>
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
