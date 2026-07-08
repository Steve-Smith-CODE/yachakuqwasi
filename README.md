<div align="center">

# 🦅 YachakuqWasi

### Portal de alojamiento estudiantil — UNSCH, Ayacucho, Perú

<p>
<img src="https://img.shields.io/badge/version-4-blue?style=for-the-badge" alt="version" />
<img src="https://img.shields.io/badge/status-en%20desarrollo-yellow?style=for-the-badge" alt="status" />
<img src="https://img.shields.io/badge/tests-257%2F257%20passing-brightgreen?style=for-the-badge" alt="tests" />
<img src="https://img.shields.io/badge/coverage-99.5%25-brightgreen?style=for-the-badge" alt="coverage" />
</p>

</div>

---

## 📚 Sobre el proyecto

**YachakuqWasi** ("la casa que enseña", en quechua) conecta a estudiantes de la UNSCH con arrendadores de cuartos, departamentos y casas cerca de la Ciudad Universitaria, en Ayacucho. Los estudiantes buscan y filtran alojamientos; los arrendadores publican propiedades; un panel de administración verifica documentos y modera usuarios. Maki, la mascota (un halcón), es el asistente virtual con IA generativa (Gemini/Groq) integrado en la plataforma.

---

## 🗂️ Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| `backend/` | API REST (Node.js + Express), autenticación y datos vía Supabase |
| `frontend/` | Cliente web de la plataforma (React + Vite) |
| `supabase/` | Esquema de base de datos y migraciones (Supabase CLI) |

---

## ✅ Fase 1 — Endurecimiento del backend

Se revisó el backend y se reforzaron varios puntos de seguridad y calidad, explicados en simple:

- 🔑 **Se corrigió una clave secreta expuesta** — un archivo de ejemplo tenía una API key real en vez de un placeholder.
- 🛡️ **La API ahora valida los datos antes de guardarlos** — si algo llega incompleto o mal formado, se rechaza con un mensaje claro, antes de tocar la base de datos.
- 🚦 **Los errores se manejan de forma centralizada y consistente** — un solo sistema para "no encontrado", "no autorizado", "dato inválido", etc.
- 📝 **Cada petición queda registrada con un identificador único**, para poder rastrear qué pasó si algo falla.
- ⏱️ **Se limita cuántas peticiones puede hacer una misma persona en poco tiempo**, para evitar abusos.
- 🧩 **Se separó el arranque del servidor de su configuración**, para poder testear la API sin levantar un puerto real.
- 🧪 **Todo esto sin romper nada:** los 257 tests automáticos del backend siguen pasando, con ~99.5% de cobertura de código.

---

## 🛠️ Tecnologías

<p align="left">
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
<img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
</p>

---

## ⚙️ Cómo correrlo localmente

```bash
npm run local:install-all   # instala dependencias de raíz, backend y frontend
npm run local:dev           # levanta backend y frontend juntos
```

El backend necesita un archivo `.env` propio (copia `backend/.env.example` y complétalo con tus credenciales de Supabase). Lo mismo para `frontend/.env`.

```bash
cd backend && npm test      # corre la suite completa con cobertura
```

---

## 🎓 Contexto académico

- 🏫 **Universidad:** Universidad Nacional de San Cristóbal de Huamanga (UNSCH)
- 🎓 **Escuela Profesional:** Ingeniería de Sistemas
- 📖 **Curso:** IS-489

---

<p align="center">
<i>🦅 Desarrollado por <a href="https://github.com/Steve-Smith-CODE">@Steve-Smith-CODE</a> — Proyecto académico, UNSCH</i>
</p>
