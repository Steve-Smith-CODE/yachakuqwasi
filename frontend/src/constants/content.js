export const MACOT_TIPS = [
  {
    id: "tip-1",
    title: "Presupuesto Estudioso",
    message:
      "En Ayacucho, el costo promedio de cuartos para estudiantes universitarios varía entre 150 y 350 soles mensuales. ¡Busca alojamientos que incluyan servicios de luz y agua para evitar sorpresas en fin de mes, hermano!",
    category: "budget"
  },
  {
    id: "tip-2",
    title: "Cercanía a la UNSCH",
    message:
      "Los barrios de San Blas, Av. Independencia y Belén están a pasos de la Ciudad Universitaria. Ahorrarás mucho en pasajes de mototaxi y podrás volver a casa rápido después de las clases nocturnas de tu facultad.",
    category: "location"
  },
  {
    id: "tip-3",
    title: "Seguridad y Tranquilidad",
    message:
      "¡Tu seguridad es lo primero, wawa! Asegúrate de que las puertas tengan cerraduras confiables, que el barrio sea bien iluminado de noche, y de preferencia pregunta si los dueños de casa viven en el mismo edificio.",
    category: "safety"
  },
  {
    id: "tip-4",
    title: "Hábito de Estudio y Descanso",
    message:
      "Pregunta a tus futuros compañeros de casa sobre las reglas de convivencia. El ruido excesivo puede perjudicar tu preparación académica. Un espacio kusi (feliz) y silencioso es ideal para tus exámenes finales.",
    category: "academic"
  }
];

export const TIP_CATEGORY_LABEL = {
  safety: "Seguridad",
  budget: "Presupuesto",
  location: "Zona",
  academic: "Estudio"
};

export const STUDENT_TESTIMONIALS = [
  {
    id: "t-1",
    studentName: "Rubén Mendoza",
    faculty: "Ingeniería de Minas",
    content:
      "¡YachakuqWasi me salvó la vida! Gracias a Maki encontré una habitación súper cerca al pabellón de minas a un precio excelente. La verificación de Maki realmente da seguridad.",
    rating: 5
  },
  {
    id: "t-2",
    studentName: "Katherin Ccoyllo",
    faculty: "Educación Inicial",
    content:
      "Maki me dio el tip de buscar en San Blas porque el barrio es tranquilo y está lleno de fotocopiadoras y restaurantes económicos para estudiantes. ¡Recomendadísimo!",
    rating: 5
  },
  {
    id: "t-3",
    studentName: "Joel Noa",
    faculty: "Ciencias de la Salud",
    content:
      "Estudiar enfermería exige mucho tiempo, por eso busqué con baño propio en Belén. Los consejos de Maki sobre el ruido me ayudaron a elegir un casero muy respetuoso.",
    rating: 5
  }
];

export const NEIGHBORHOODS = ["San Blas", "Av. Independencia", "Belén", "Carmen Alto", "Santa Ana"];

export const TYPE_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Habitación", value: "room" },
  { label: "Departamento", value: "apartment" },
  { label: "Compartido", value: "shared" },
  { label: "Familiar", value: "family" }
];

export const TYPE_LABEL = { room: "Habitación", apartment: "Departamento", shared: "Compartido", family: "Familiar" };
