// Los 10 alojamientos reales de Ayacucho usados para el seed (fuente:
// capturas de Airbnb en IMAGENES/, ver INFO.txt de cada carpeta).
//
// Este lote es para la ventana de roomies (cuartos compartidos entre
// estudiantes). El `type` se asigna segun cuantas habitaciones separadas
// tiene el alojamiento, no de forma pareja para los 10:
// - 'shared' = 2-3 habitaciones, pensado para que varios estudiantes se
//   repartan el departamento (David, Flavia, Sebastian, Bertha, las dos
//   de Elizabeth, Mabel Pilar).
// - 'room' = departamento/loft de 1 sola habitacion para 1-2 personas
//   (Illari Wari, Sheyla, Alancito): no alcanza para "compartir" entre
//   varios estudiantes con habitaciones propias.
// Cada amenities[0] indica para cuantos estudiantes alcanza (segun la
// capacidad de huespedes que reporta Airbnb), para que el explorador lo
// muestre de inmediato como primer tag de la tarjeta.
//
// El precio de origen (`priceStayPen`) es la tarifa TURÍSTICA total por
// `stayNights` noches, no un alquiler mensual. seed-helpers.js la convierte
// a precio mensual con (priceStayPen / stayNights) * 30.
//
// Las 4 publicaciones de HABITACIONES_PARA_ESTUDIANTES (mas abajo) vienen de
// anuncios directos (Facebook Marketplace) donde el precio YA es mensual, no
// turistico. Para reusar la misma formula sin duplicar logica, se declaran
// con stayNights: 30 (priceStayPen / 30 * 30 = priceStayPen, sin conversion).
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
      'HABITACIONES-ROMMIES/4Departamento en el centro con vista panorámica. - Apartamento con servicios incluidos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'arrendador@yachakuqwasi.pe', // alias de la cuenta demo documentada (DEMO_ACCOUNTS.landlord)
    hostFirstName: 'David',
    title: 'Departamento en el centro con vista panorámica',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'Zona céntrica de Ayacucho, acceso por pasadizo independiente (dirección exacta reservada por el anfitrión)',
    description:
      'Departamento de 2 habitaciones en pleno centro de Ayacucho, con vista al horizonte de la ciudad. Zona tranquila, céntrica y segura, cerca de mercados, bodegas, farmacias, bancos y agencias de turismo. Independiente y alejado del ruido de la calle. Anfitrión: David.',
    amenities: [
      'Para 4 estudiantes', 'Vista a la ciudad', 'Cocina', 'Wifi', 'TV con cable', 'Refrigeradora', 'Microondas',
      'Disponible para estadías largas', '2 habitaciones', '1 baño'
    ],
    priceStayPen: 429,
    stayNights: 5,
    distanceToUnschMinutes: 15,
    contactPhone: '987654321'
  },
  {
    slug: 'flavia-posada-del-sol-ii',
    folder: 'HABITACIONES-ROMMIES/Apartamento LA POSADA DEL SOL II - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'flavia@yachakuqwasi.pe',
    hostFirstName: 'Flavia',
    title: 'Apartamento La Posada del Sol II',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'Ayacucho, Perú (dirección exacta reservada por el anfitrión)',
    description:
      'Departamento de 2 habitaciones en zona tranquila y de fácil acceso. Buena comunicación con la anfitriona Flavia y check-in sencillo. Cuenta con cocina, lavadora y todo lo necesario para una estadía cómoda.',
    amenities: ['Para 4 estudiantes', 'Cocina', 'Wifi', 'TV', 'Lavadora', 'Refrigeradora', 'Microondas', '2 habitaciones', '1 baño'],
    priceStayPen: 437,
    stayNights: 5,
    distanceToUnschMinutes: 15,
    contactPhone: '987654322'
  },
  {
    slug: 'sebastian-delprado',
    folder:
      'HABITACIONES-ROMMIES/DelPradoApartamento - Apartamento con servicios incluidos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'sebastian@yachakuqwasi.pe',
    hostFirstName: 'Sebastián',
    title: 'Del Prado - Apartamento con servicios incluidos',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'A 2 cuadras de la Plaza de Armas, 4to piso (dirección exacta reservada por el anfitrión)',
    description:
      'Amplio departamento de 3 habitaciones a solo 2 cuadras de la Plaza de Armas, con vista panorámica de la ciudad. Suite principal con jacuzzi privado, cocina totalmente equipada, comedor para 6 personas, sala de estar con HBO, garaje privado gratuito y recepción con seguridad 24 horas. Anfitrión: Sebastián.',
    amenities: [
      'Para 6 estudiantes', 'Wifi', 'Zona de trabajo privada', 'Jacuzzi privado', 'TV en todas las habitaciones',
      'Cocina equipada', 'Comedor para 6 personas', 'Sala de estar con HBO', 'Garaje privado gratuito',
      'Seguridad 24h', '3 habitaciones', '2.5 baños'
    ],
    priceStayPen: 549,
    stayNights: 5,
    distanceToUnschMinutes: 14,
    contactPhone: '987654323'
  },
  {
    slug: 'illari-depto-emadi',
    folder: 'HABITACIONES-ROMMIES/Departamento en Ayacucho - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'illariwari@yachakuqwasi.pe',
    hostFirstName: 'Illari Wari',
    title: 'Departamento en Ayacucho - Zona Emadi',
    type: 'room',
    neighborhood: 'Ayacucho',
    address: 'Zona residencial Emadi, Ayacucho (dirección exacta reservada por el anfitrión)',
    description:
      'Departamento independiente de 1 habitación en la zona residencial y tranquila de Emadi, ideal para 1-2 estudiantes. Estacionamiento gratuito y cámaras de seguridad exteriores. Cama King, cocina y zona de trabajo privada. Anfitriona: Illari Wari.',
    amenities: [
      'Para 1-2 estudiantes', 'Cocina', 'Wifi', 'Zona de trabajo privada', 'Estacionamiento gratuito', 'TV',
      'Lavadora', 'Cámaras de seguridad', '1 habitación', 'Baño privado', 'Cama King'
    ],
    priceStayPen: 370,
    stayNights: 5,
    distanceToUnschMinutes: 16,
    contactPhone: '987654324'
  },
  {
    slug: 'bertha-dpto-estreno',
    folder: 'HABITACIONES-ROMMIES/Dpto estreno zona segura 2 Habt. - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'bertha@yachakuqwasi.pe',
    hostFirstName: 'Bertha',
    title: 'Departamento a estrenar en zona segura',
    type: 'shared',
    neighborhood: 'Andrés Avelino Cáceres Dorregaray',
    address: 'A 5 minutos del aeropuerto, 10 minutos del centro (dirección exacta reservada por la anfitriona)',
    description:
      'Departamento a estrenar de 2 habitaciones en zona tranquila y segura, a 5 minutos del aeropuerto y restaurantes, y a 10 minutos del centro de la ciudad. Incluye estacionamiento gratuito, cafetera y cámaras de seguridad. Anfitriona: Bertha.',
    amenities: [
      'Para 5 estudiantes', 'Cocina', 'Wifi', 'Zona de trabajo privada', 'TV 42"', 'Lavadora (de pago)',
      'Refrigeradora', 'Microondas', 'Cámaras de seguridad', 'Estacionamiento gratuito', 'Cafetera',
      '2 habitaciones', '2 baños privados'
    ],
    priceStayPen: 559,
    stayNights: 5,
    distanceToUnschMinutes: 22,
    contactPhone: '987654325'
  },
  {
    slug: 'sheyla-loft-emadi',
    folder: 'HABITACIONES-ROMMIES/Loft Emadi Ayacucho - Lofts en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'sheyla@yachakuqwasi.pe',
    hostFirstName: 'Sheyla',
    title: 'Loft Emadi Ayacucho',
    type: 'room',
    neighborhood: 'Ayacucho',
    address: 'Zona Emadi, Ayacucho (dirección exacta reservada por la anfitriona)',
    description:
      'Loft independiente de 1 habitación en zona tranquila y de fácil acceso en Emadi, ideal para 1-2 estudiantes. Cuenta con patio o balcón privado, estacionamiento en la calle y zona de trabajo. Anfitriona: Sheyla (Superanfitriona).',
    amenities: [
      'Para 1-2 estudiantes', 'Cocina', 'Wifi', 'Zona de trabajo privada', 'Estacionamiento en la calle', 'TV',
      'Balcón privado', 'Patio trasero compartido', 'Secadora de pelo', '1 habitación', 'Baño privado'
    ],
    priceStayPen: 500,
    stayNights: 5,
    distanceToUnschMinutes: 16,
    contactPhone: '987654326'
  },
  {
    slug: 'alancito-lucia-wasi-inti',
    folder: 'HABITACIONES-ROMMIES/Lucía Wasi INTI - Ayacucho - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'alancito@yachakuqwasi.pe',
    hostFirstName: 'Alancito',
    title: 'Lucía Wasi INTI',
    type: 'room',
    neighborhood: 'Ayacucho',
    address: 'Zona céntrica de Ayacucho (dirección exacta reservada por el anfitrión)',
    description:
      'Agradable minidepartamento de 1 habitación, céntrico y seguro, ideal para 1-2 estudiantes. Baño compartido. Anfitrión: Alancito (Superanfitrión).',
    amenities: ['Para 1-2 estudiantes', 'Céntrico y seguro', '1 habitación', 'Baño compartido'],
    priceStayPen: 495,
    stayNights: 5,
    distanceToUnschMinutes: 14,
    contactPhone: '987654327'
  },
  {
    slug: 'elizabeth-media-cuadra-piso3',
    folder: 'HABITACIONES-ROMMIES/Media cuadra de la plaza de Armas piso 3 - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'elizabeth@yachakuqwasi.pe',
    hostFirstName: 'Elizabeth',
    title: 'Media cuadra de la Plaza de Armas - Piso 3',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'A media cuadra de la Plaza de Armas, 3er piso (dirección exacta reservada por la anfitriona)',
    description:
      'Departamento de 2 habitaciones a media cuadra de la Plaza de Armas, en el tercer piso. Zona tranquila y conveniente, fácil de recorrer a pie. Anfitriona: Elizabeth (Superanfitriona).',
    amenities: ['Para 4 estudiantes', 'Cocina', 'Wifi', 'TV de alta definición', 'Refrigeradora', 'Microondas', '2 habitaciones', '1 baño privado'],
    priceStayPen: 484,
    stayNights: 5,
    distanceToUnschMinutes: 14,
    contactPhone: '987654328'
  },
  {
    slug: 'elizabeth-terraza-piso5',
    folder: 'HABITACIONES-ROMMIES/Terraza media cuadra plaza de armas , 5to piso - Apartamentos en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'elizabeth2@yachakuqwasi.pe',
    hostFirstName: 'Elizabeth',
    title: 'Terraza media cuadra Plaza de Armas - Piso 5',
    type: 'shared',
    neighborhood: 'Ayacucho',
    address: 'A media cuadra de la Plaza de Armas, 5to piso con terraza (dirección exacta reservada por la anfitriona)',
    description:
      'Departamento con terraza y linda vista panorámica de la ciudad, a media cuadra de la Plaza de Armas. 1 habitación con 2 camas para compartir entre 4 estudiantes. Alojamiento tranquilo y céntrico, en el quinto piso. Anfitriona: Elizabeth (Superanfitriona).',
    amenities: [
      'Para 4 estudiantes', 'Cocina', 'Wifi', 'Zona de trabajo privada', 'TV 42"', 'Lavadora (de pago)',
      'Refrigeradora', 'Microondas', 'Cámaras de seguridad', 'Terraza con vista panorámica', '1 habitación (2 camas)',
      'Baño privado'
    ],
    priceStayPen: 437,
    stayNights: 5,
    distanceToUnschMinutes: 14,
    contactPhone: '987654329'
  },
  {
    slug: 'mabel-sumaq-wasy',
    folder: 'HABITACIONES-ROMMIES/«Sumaq Wasy» - Casas en alquiler en Ayacucho, Ayacucho, Perú - Airbnb',
    email: 'mabelpilar@yachakuqwasi.pe',
    hostFirstName: 'Mabel Pilar',
    title: '«Sumaq Wasy»',
    type: 'shared',
    neighborhood: 'Andrés Avelino Cáceres Dorregaray',
    address: 'Cerca del Aeropuerto Coronel FAP Alfredo Mendívil Duarte (dirección exacta reservada por la anfitriona)',
    description:
      'Casa completa de 3 habitaciones en zona de paz y tranquilidad, muy cerca del aeropuerto de Ayacucho. Ideal para compartir entre varios estudiantes. Llegada autónoma mediante caja de seguridad para llaves. Anfitriona: Mabel Pilar (Superanfitriona).',
    amenities: [
      'Para hasta 6 estudiantes', 'Llegada autónoma (caja de seguridad)', 'Zona tranquila', '3 habitaciones',
      '2 baños', 'Cerca al aeropuerto'
    ],
    priceStayPen: 336,
    stayNights: 5,
    distanceToUnschMinutes: 24,
    contactPhone: '987654330'
  },

  // ---- Habitaciones para un solo estudiante (Facebook Marketplace) ----
  {
    slug: 'los-andes-belen',
    folder: 'HABITACIONES PARA ESTUDIANTES/1',
    email: 'arrendador.losandes@yachakuqwasi.pe',
    hostFirstName: 'Arrendador Los Andes', // el anuncio no da nombre de anfitrion, solo telefono
    title: 'Habitación amoblada en Barrio Belén',
    type: 'room',
    neighborhood: 'San Juan Bautista',
    address: 'Av. Los Andes 521, Barrio Belén, pasando la iglesia de Quinuapata',
    description:
      'Habitación amoblada con cama de 2 plazas, TV Smart y baño privado con agua caliente. El alquiler incluye agua y luz. Pago mensual adelantado.',
    amenities: ['Para 1 estudiante', 'Cama 2 plazas', 'TV Smart', 'Baño privado', 'Agua caliente', 'Incluye agua y luz'],
    priceStayPen: 350,
    stayNights: 30, // ya es precio mensual, ver nota al inicio del archivo
    distanceToUnschMinutes: 15,
    contactPhone: '939907551'
  },
  {
    slug: 'alameda-barcelona-susan',
    folder: 'HABITACIONES PARA ESTUDIANTES/3',
    email: 'susanliliana@yachakuqwasi.pe',
    hostFirstName: 'Susan Liliana',
    title: 'Habitación en Alameda Barcelona',
    type: 'room',
    neighborhood: 'Ayacucho',
    address: 'Alameda Barcelona, cerca a la UNSCH, Residencia Universitaria, IPD y Electrocentro',
    description:
      'Habitación para estudiante o persona sola en Alameda Barcelona, a pocos pasos de la UNSCH, la Residencia Universitaria, el IPD y Electrocentro. Incluye wifi y ducha eléctrica. Anfitriona: Susan Liliana.',
    amenities: ['Para 1 estudiante', 'Wifi', 'Ducha eléctrica'],
    priceStayPen: 230,
    stayNights: 30,
    distanceToUnschMinutes: 7,
    contactPhone: '906831302'
  },
  {
    slug: 'covadonga-sandro',
    folder: 'HABITACIONES PARA ESTUDIANTES/4',
    email: 'sandrosantaipe@yachakuqwasi.pe',
    hostFirstName: 'Sandro San Taipe Torres',
    title: 'Cuartos cerca a la puerta 4 de la UNSCH',
    type: 'room',
    neighborhood: 'Ayacucho',
    address: 'A 8 min de la puerta 4 de la UNSCH, cerca al Archivo Regional ENACE, referencia Colegio Covadonga',
    description:
      '2 habitaciones disponibles a solo 8 minutos caminando de la puerta 4 de la UNSCH, cerca al Archivo Regional de ENACE y al parque del adulto mayor. Cuentan con baño privado y compartido, garaje y vista a la calle. Solo para universitarios responsables o personas solas (no se aceptan niños ni mascotas). Anfitrión: Sandro San Taipe Torres.',
    amenities: ['Para 1 estudiante', '2 habitaciones disponibles', 'Baño privado y compartido', 'Garaje', 'Vista a la calle'],
    priceStayPen: 250,
    stayNights: 30,
    distanceToUnschMinutes: 8,
    contactPhone: '925204607'
  },
  {
    slug: 'bolognesi-yuly',
    folder: 'HABITACIONES PARA ESTUDIANTES/5',
    email: 'yulyaguilar@yachakuqwasi.pe',
    hostFirstName: 'Yuly Aguilar Moreno',
    title: 'Habitación en Av. Bolognesi',
    type: 'room',
    neighborhood: 'San Juan Bautista',
    address: 'Av. Bolognesi S/N, San Juan Bautista, frente al mercado Las Américas',
    description:
      'Habitación para estudiante o persona sola (sin hijos), en lugar céntrico frente al mercado Las Américas y a unas cuadras de Plaza Vea Huamanga. Cuenta con baño privado y cama. Anfitriona: Yuly Aguilar Moreno.',
    amenities: ['Para 1 estudiante', 'Baño privado', 'Cama'],
    priceStayPen: 250, // el anuncio original no incluia precio; estimado segun el rango de las otras habitaciones individuales
    stayNights: 30,
    distanceToUnschMinutes: 12,
    contactPhone: '927649335'
  }
];
