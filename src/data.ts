import { HousingListing, MascotTip, Testimonial } from "./types";

export const MACOT_TIPS: MascotTip[] = [
  {
    id: "tip-1",
    title: "Presupuesto Estudioso",
    message: "En Ayacucho, el costo promedio de cuartos para estudiantes universitarios varía entre 150 y 350 soles mensuales. ¡Busca alojamientos que incluyan servicios de luz y agua para evitar sorpresas en fin de mes, hermano!",
    category: "budget",
  },
  {
    id: "tip-2",
    title: "Cercanía a la UNSCH",
    message: "Los barrios de San Blas, Av. Independencia y Belén están a pasos de la Ciudad Universitaria. Ahorrarás mucho en pasajes de mototaxi y podrás volver a casa rápido después de las clases nocturnas de tu facultad.",
    category: "location",
  },
  {
    id: "tip-3",
    title: "Seguridad y Tranquilidad",
    message: "¡Tu seguridad es lo primero, wawa! Asegúrate de que las puertas tengan cerraduras confiables, que el barrio sea bien iluminado de noche, y de preferencia pregunta si los dueños de casa viven en el mismo edificio.",
    category: "safety",
  },
  {
    id: "tip-4",
    title: "Hábito de Estudio y Descanso",
    message: "Pregunta a tus futuros compañeros de casa sobre las reglas de convivencia. El ruido excesivo puede perjudicar tu preparación académica. Un espacio kusi (feliz) y silencioso es ideal para tus exámenes finales.",
    category: "academic",
  },
];

export const HOUSING_LISTINGS: HousingListing[] = [
  {
    id: "list-1",
    title: "Habitación Amoblada San Blas - Ideal UNSCH",
    type: "room",
    pricePen: 230,
    distanceToUnschMinutes: 5,
    neighborhood: "San Blas",
    address: "Jr. Tres Máscaras 425",
    description: "Habitación iluminada con cama, escritorio y closet. Baño compartido impecable. Acceso directo a lavandería y patio de piedra de Huamanga. Ambiente super tranquilo ideal para el estudio universitario.",
    amenities: ["Wi-Fi de alta velocidad", "Servicios incluidos (Agua/Luz)", "Acceso a Cocina", "Lavandería"],
    contactPhone: "+51 966 123 456",
    landlordName: "Sra. Teodora Quispe",
    verifiedByMaki: true,
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"
    ],
    coordinates: { x: 45, y: 35 }
  },
  {
    id: "list-2",
    title: "Minidepartamento Independiente cerca de Av. Independencia",
    type: "apartment",
    pricePen: 580,
    distanceToUnschMinutes: 7,
    neighborhood: "Av. Independencia",
    address: "Jr. Los Diamantes 112",
    description: "Minidepartamento con entrada totalmente independiente, baño propio, una pequeña cocina americana y dormitorio amplio. A espaldas de la puerta posterior de la Ciudad Universitaria.",
    amenities: ["Baño Propio", "Cocina Equipada", "Wi-Fi de alta velocidad", "Servicios incluidos (Agua/Luz)"],
    contactPhone: "+51 984 765 432",
    landlordName: "Don Valerio Huamán",
    verifiedByMaki: true,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80"
    ],
    coordinates: { x: 55, y: 25 }
  },
  {
    id: "list-3",
    title: "Cuarto Universitario Económico en Carmen Alto",
    type: "shared",
    pricePen: 160,
    distanceToUnschMinutes: 15,
    neighborhood: "Carmen Alto",
    address: "Jr. Progreso 321",
    description: "Habitación ideal para estudiantes de presupuestos ajustados. Baño compartido con otros dos universitarios de la UNSCH. Zona segura y muy tradicional de Ayacucho, con transporte público directo a la puerta principal.",
    amenities: ["Luz y Agua incluidos", "Wi-Fi", "Espacio para tender ropa"],
    contactPhone: "+51 961 456 789",
    landlordName: "Sra. Julia Palomino",
    verifiedByMaki: false,
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80"
    ],
    coordinates: { x: 30, y: 70 }
  },
  {
    id: "list-4",
    title: "Habitación Estudiantil con Baño Propio en Belén",
    type: "room",
    pricePen: 320,
    distanceToUnschMinutes: 10,
    neighborhood: "Belén",
    address: "Jr. Sol de Oro 154",
    description: "Habitación amplia en el segundo piso con baño privado completo y excelente ventilación natural. Ventanales grandes con vista a las iglesias históricas de Ayacucho. A pasos de la plaza de Belén.",
    amenities: ["Baño Propio", "Wi-Fi de alta velocidad", "Servicios incluidos (Agua/Luz)", "Mesa de Estudio"],
    contactPhone: "+51 945 889 221",
    landlordName: "Ing. Rolando Sulca",
    verifiedByMaki: true,
    images: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=600&q=80"
    ],
    coordinates: { x: 40, y: 50 }
  },
  {
    id: "list-5",
    title: "Dormitorio Compartido Estilo Residencia en Santa Ana",
    type: "shared",
    pricePen: 190,
    distanceToUnschMinutes: 12,
    neighborhood: "Santa Ana",
    address: "Jr. Mariscal Cáceres 780",
    description: "Espacio en casa colonial tradicional de artesanos de Santa Ana. Comparte áreas comunes y baño con estudiantes de la Facultad de Educación. Precioso jardín central de piedra de Huamanga.",
    amenities: ["Servicios incluidos (Agua/Luz)", "Wi-Fi", "Acceso a patio colonial", "Lavadora compartida"],
    contactPhone: "+51 999 111 222",
    landlordName: "Maestro Don Alfonso Luján",
    verifiedByMaki: true,
    images: [
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=600&q=80"
    ],
    coordinates: { x: 20, y: 40 }
  },
];

export const STUDENT_TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    studentName: "Rubén Mendoza",
    faculty: "Ingeniería de Minas",
    content: "¡Alójate UNSCH me salvó la vida! Gracias a Maki encontré una habitación súper cerca al pabellón de minas a un precio excelente. La verificación de Maki realmente da seguridad.",
    rating: 5,
  },
  {
    id: "t-2",
    studentName: "Katherin Ccoyllo",
    faculty: "Educación Inicial",
    content: "Maki me dio el tip de buscar en San Blas porque el barrio es tranquilo y está lleno de fotocopiadoras y restaurantes económicos para estudiantes. ¡Recomendadísimo!",
    rating: 5,
  },
  {
    id: "t-3",
    studentName: "Joel Noa",
    faculty: "Ciencias de la Salud",
    content: "Estudiar enfermería exige mucho tiempo, por eso busqué con baño propio en Belén. Los consejos de Maki sobre el ruido me ayudaron a elegir un casero muy respetuoso.",
    rating: 5,
  },
];
