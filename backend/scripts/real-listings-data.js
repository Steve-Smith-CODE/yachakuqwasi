// Los 10 alojamientos reales de Ayacucho usados para el seed (fuente:
// capturas de Airbnb en IMAGENES/, ver INFO.txt de cada carpeta).
//
// Este lote es para la ventana de roomies (cuartos compartidos entre
// estudiantes): todos usan type: 'shared'. Un lote futuro para
// habitaciones de un solo estudiante usara type: 'room'.
//
// El precio de origen (`priceStayPen`) es la tarifa TURÍSTICA total por
// `stayNights` noches, no un alquiler mensual. seed-helpers.js la convierte
// a precio mensual con (priceStayPen / stayNights) * 30.
//
// El distrito (`neighborhood`) es una estimación a partir de las pistas de
// ubicación del anuncio (Airbnb no publica la dirección exacta):
// - "Plaza de Armas" / centro histórico -> Ayacucho.
// - "Zona Emadi" -> Ayacucho (Parque Emadi está en el distrito de Ayacucho,
//   no en San Juan Bautista, según fuentes de mapas consultadas).
// - Cercanía al aeropuerto Alfredo Mendívil Duarte -> Andrés Avelino
//   Cáceres Dorregaray (el aeropuerto está en ese distrito).
// Ajusta el campo si conoces la ubicación real con más precisión.
export const REAL_LISTINGS = [
  {
    slug: 'david-depto-centro',
    folder:
      '4Departamento en el centro con vista panorámica. - Apartamento con servicios incluidos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'arrendador@yachakuqwasi.pe', // alias de la cuenta demo documentada (DEMO_ACCOUNTS.landlord)
    hostFirstName: 'David',
    title: 'Departamento en el centro con vista panorámica',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'Zona céntrica de Ayacucho, acceso por pasadizo independiente (dirección exacta reservada por el anfitrión)',
    description:
      'Departamento de 2 habitaciones en pleno centro de Ayacucho, con vista al horizonte de la ciudad. Zona tranquila, céntrica y segura, cerca de mercados, bodegas, farmacias, bancos y agencias de turismo. Independiente y alejado del ruido de la calle. Anfitrión: David.',
    amenities: [
      'Vista a la ciudad', 'Cocina', 'Wifi', 'TV con cable', 'Refrigeradora', 'Microondas',
      'Disponible para estadías largas', '2 habitaciones', '1 baño', 'Hasta 4 huéspedes'
    ],
    priceStayPen: 429,
    stayNights: 5,
    distanceToUnschMinutes: 15,
    contactPhone: '987654321'
  },
  {
    slug: 'flavia-posada-del-sol-ii',
    folder: 'Apartamento LA POSADA DEL SOL II - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'flavia@yachakuqwasi.pe',
    hostFirstName: 'Flavia',
    title: 'Apartamento La Posada del Sol II',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'Ayacucho, Perú (dirección exacta reservada por el anfitrión)',
    description:
      'Departamento de 2 habitaciones en zona tranquila y de fácil acceso. Buena comunicación con la anfitriona Flavia y check-in sencillo. Cuenta con cocina, lavadora y todo lo necesario para una estadía cómoda.',
    amenities: ['Cocina', 'Wifi', 'TV', 'Lavadora', 'Refrigeradora', 'Microondas', '2 habitaciones', '1 baño', 'Hasta 4 huéspedes'],
    priceStayPen: 437,
    stayNights: 5,
    distanceToUnschMinutes: 15,
    contactPhone: '987654322'
  },
  {
    slug: 'sebastian-delprado',
    folder:
      'DelPradoApartamento - Apartamento con servicios incluidos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'sebastian@yachakuqwasi.pe',
    hostFirstName: 'Sebastián',
    title: 'Del Prado - Apartamento con servicios incluidos',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'A 2 cuadras de la Plaza de Armas, 4to piso (dirección exacta reservada por el anfitrión)',
    description:
      'Amplio departamento de 3 habitaciones a solo 2 cuadras de la Plaza de Armas, con vista panorámica de la ciudad. Suite principal con jacuzzi privado, cocina totalmente equipada, comedor para 6 personas, sala de estar con HBO, garaje privado gratuito y recepción con seguridad 24 horas. Anfitrión: Sebastián.',
    amenities: [
      'Wifi', 'Zona de trabajo privada', 'Jacuzzi privado', 'TV en todas las habitaciones', 'Cocina equipada',
      'Comedor para 6 personas', 'Sala de estar con HBO', 'Garaje privado gratuito', 'Seguridad 24h',
      '3 habitaciones', '2.5 baños', 'Hasta 6 huéspedes'
    ],
    priceStayPen: 549,
    stayNights: 5,
    distanceToUnschMinutes: 14,
    contactPhone: '987654323'
  },
  {
    slug: 'illari-depto-emadi',
    folder: 'Departamento en Ayacucho - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'illariwari@yachakuqwasi.pe',
    hostFirstName: 'Illari Wari',
    title: 'Departamento en Ayacucho - Zona Emadi',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'Zona residencial Emadi, Ayacucho (dirección exacta reservada por el anfitrión)',
    description:
      'Lindo departamento independiente en la zona residencial y tranquila de Emadi, con estacionamiento gratuito y cámaras de seguridad exteriores. Cama King, cocina y zona de trabajo privada. Anfitriona: Illari Wari.',
    amenities: [
      'Cocina', 'Wifi', 'Zona de trabajo privada', 'Estacionamiento gratuito', 'TV', 'Lavadora',
      'Cámaras de seguridad', '1 habitación', 'Baño privado', 'Cama King', 'Hasta 2 huéspedes'
    ],
    priceStayPen: 370,
    stayNights: 5,
    distanceToUnschMinutes: 16,
    contactPhone: '987654324'
  },
  {
    slug: 'bertha-dpto-estreno',
    folder: 'Dpto estreno zona segura 2 Habt. - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'bertha@yachakuqwasi.pe',
    hostFirstName: 'Bertha',
    title: 'Departamento a estrenar en zona segura',
    type: 'shared',
    neighborhood: 'Andrés Avelino Cáceres Dorregaray',
    address: 'A 5 minutos del aeropuerto, 10 minutos del centro (dirección exacta reservada por la anfitriona)',
    description:
      'Departamento a estrenar de 2 habitaciones en zona tranquila y segura, a 5 minutos del aeropuerto y restaurantes, y a 10 minutos del centro de la ciudad. Incluye estacionamiento gratuito, cafetera y cámaras de seguridad. Anfitriona: Bertha.',
    amenities: [
      'Cocina', 'Wifi', 'Zona de trabajo privada', 'TV 42"', 'Lavadora (de pago)', 'Refrigeradora', 'Microondas',
      'Cámaras de seguridad', 'Estacionamiento gratuito', 'Cafetera', '2 habitaciones', '2 baños privados', 'Hasta 5 huéspedes'
    ],
    priceStayPen: 559,
    stayNights: 5,
    distanceToUnschMinutes: 22,
    contactPhone: '987654325'
  },
  {
    slug: 'sheyla-loft-emadi',
    folder: 'Loft Emadi Ayacucho - Lofts en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'sheyla@yachakuqwasi.pe',
    hostFirstName: 'Sheyla',
    title: 'Loft Emadi Ayacucho',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'Zona Emadi, Ayacucho (dirección exacta reservada por la anfitriona)',
    description:
      'Loft independiente en zona tranquila y de fácil acceso en Emadi. Cuenta con patio o balcón privado, estacionamiento en la calle y zona de trabajo. Anfitriona: Sheyla (Superanfitriona).',
    amenities: [
      'Cocina', 'Wifi', 'Zona de trabajo privada', 'Estacionamiento en la calle', 'TV', 'Balcón privado',
      'Patio trasero compartido', 'Secadora de pelo', '1 habitación', 'Baño privado', 'Hasta 2 huéspedes'
    ],
    priceStayPen: 500,
    stayNights: 5,
    distanceToUnschMinutes: 16,
    contactPhone: '987654326'
  },
  {
    slug: 'alancito-lucia-wasi-inti',
    folder: 'Lucía Wasi INTI - Ayacucho - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'alancito@yachakuqwasi.pe',
    hostFirstName: 'Alancito',
    title: 'Lucía Wasi INTI',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'Zona céntrica de Ayacucho (dirección exacta reservada por el anfitrión)',
    description:
      'Agradable minidepartamento céntrico y seguro, ideal para estadías tranquilas. Baño compartido. Anfitrión: Alancito (Superanfitrión).',
    amenities: ['Céntrico y seguro', '1 habitación', 'Baño compartido', 'Hasta 2 huéspedes'],
    priceStayPen: 495,
    stayNights: 5,
    distanceToUnschMinutes: 14,
    contactPhone: '987654327'
  },
  {
    slug: 'elizabeth-media-cuadra-piso3',
    folder: 'Media cuadra de la plaza de Armas piso 3 - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'elizabeth@yachakuqwasi.pe',
    hostFirstName: 'Elizabeth',
    title: 'Media cuadra de la Plaza de Armas - Piso 3',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'A media cuadra de la Plaza de Armas, 3er piso (dirección exacta reservada por la anfitriona)',
    description:
      'Departamento de 2 habitaciones a media cuadra de la Plaza de Armas, en el tercer piso. Zona tranquila y conveniente, fácil de recorrer a pie. Anfitriona: Elizabeth (Superanfitriona).',
    amenities: ['Cocina', 'Wifi', 'TV de alta definición', 'Refrigeradora', 'Microondas', '2 habitaciones', '1 baño privado', 'Hasta 4 huéspedes'],
    priceStayPen: 484,
    stayNights: 5,
    distanceToUnschMinutes: 14,
    contactPhone: '987654328'
  },
  {
    slug: 'elizabeth-terraza-piso5',
    folder: 'Terraza media cuadra plaza de armas , 5to piso - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'elizabeth2@yachakuqwasi.pe',
    hostFirstName: 'Elizabeth',
    title: 'Terraza media cuadra Plaza de Armas - Piso 5',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'A media cuadra de la Plaza de Armas, 5to piso con terraza (dirección exacta reservada por la anfitriona)',
    description:
      'Departamento con terraza y linda vista panorámica de la ciudad, a media cuadra de la Plaza de Armas. Alojamiento tranquilo y céntrico, en el quinto piso. Anfitriona: Elizabeth (Superanfitriona).',
    amenities: [
      'Cocina', 'Wifi', 'Zona de trabajo privada', 'TV 42"', 'Lavadora (de pago)', 'Refrigeradora', 'Microondas',
      'Cámaras de seguridad', 'Terraza con vista panorámica', '1 habitación (2 camas)', 'Baño privado', 'Hasta 4 huéspedes'
    ],
    priceStayPen: 437,
    stayNights: 5,
    distanceToUnschMinutes: 14,
    contactPhone: '987654329'
  },
  {
    slug: 'mabel-sumaq-wasy',
    folder: '«Sumaq Wasy» - Casas en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'mabelpilar@yachakuqwasi.pe',
    hostFirstName: 'Mabel Pilar',
    title: '«Sumaq Wasy»',
    type: 'shared',
    neighborhood: 'Andrés Avelino Cáceres Dorregaray',
    address: 'Cerca del Aeropuerto Coronel FAP Alfredo Mendívil Duarte (dirección exacta reservada por la anfitriona)',
    description:
      'Casa completa de 3 habitaciones en zona de paz y tranquilidad, muy cerca del aeropuerto de Ayacucho. Llegada autónoma mediante caja de seguridad para llaves. Anfitriona: Mabel Pilar (Superanfitriona).',
    amenities: ['Llegada autónoma (caja de seguridad)', 'Zona tranquila', '3 habitaciones', '2 baños', 'Cerca al aeropuerto'],
    priceStayPen: 336,
    stayNights: 5,
    distanceToUnschMinutes: 24,
    contactPhone: '987654330'
  }
];
