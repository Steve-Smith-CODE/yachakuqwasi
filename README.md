# YachakuqWasi

Portal de alojamiento estudiantil para la Universidad Nacional de San Cristóbal de Huamanga (UNSCH), en Ayacucho, Perú.

## ¿Qué es esto?

Una plataforma donde los estudiantes de la UNSCH pueden buscar cuartos, departamentos y casas para alquilar cerca de la universidad, y los arrendadores pueden publicar sus propiedades. Incluye un panel de administración para verificar publicaciones y usuarios.

## Cómo está organizado el repositorio

- **`backend/`** — la API real (Node.js + Express), conectada a Supabase (base de datos y autenticación).
- **`frontend/`** — el cliente web de la plataforma real (React + Vite).
- **`supabase/`** — el esquema de la base de datos y las migraciones.
- La carpeta raíz (`src/`, `server.ts`, etc.) contiene un prototipo aparte, hecho en Google AI Studio: un asistente virtual llamado **Maki** que responde preguntas sobre alquileres.

## Qué se hizo recientemente (resumen simple)

Se revisó cómo estaba armado el backend y se reforzaron varias cosas para que la aplicación sea más segura y confiable:

1. **Se corrigió una clave secreta que estaba expuesta.** Un archivo de ejemplo tenía una clave real de la API de Gemini en vez de un texto de relleno. Ya se reemplazó por un placeholder.
2. **Ahora la API revisa los datos antes de guardarlos.** Antes, si alguien mandaba datos incompletos o con el formato equivocado (por ejemplo, un precio que no es un número), el error podía llegar hasta la base de datos. Ahora se valida todo antes de procesarlo, con mensajes claros de qué está mal.
3. **Los errores se manejan de forma ordenada.** Se creó un sistema único para lanzar y responder errores ("no encontrado", "no autorizado", "dato inválido"), en vez de que cada parte del código resuelva sus propios casos por separado.
4. **Se agregó un registro (logs) más completo.** Cada petición que llega a la API ahora tiene un identificador único, así que si algo falla es más fácil rastrear exactamente qué pasó.
5. **Se limitó cuántas peticiones puede hacer una misma persona en poco tiempo**, para evitar abusos o ataques automatizados.
6. **Se separó el arranque del servidor de su configuración**, para poder probar la API sin necesidad de levantar un servidor real.
7. **Se revisó que nada de esto rompiera lo que ya funcionaba:** los 70 tests automáticos del backend siguen pasando, con una cobertura de código de casi el 98%.

## Cómo correrlo localmente

```bash
npm run local:install-all   # instala dependencias de raíz, backend y frontend
npm run local:dev           # levanta backend y frontend juntos
```

El backend necesita un archivo `.env` propio (copia `backend/.env.example` y complétalo con tus credenciales de Supabase). Lo mismo aplica para `frontend/.env`.

## Stack técnico

- **Backend:** Node.js, Express, Supabase (Postgres + Auth), Zod, Jest
- **Frontend:** React, Vite
- **Base de datos:** PostgreSQL vía Supabase, con Row Level Security

---

Proyecto académico — Ingeniería de Sistemas, UNSCH.
