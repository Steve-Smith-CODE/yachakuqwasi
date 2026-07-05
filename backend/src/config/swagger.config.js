const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'API - Alquileres UNSCH',
    version: '1.0.0',
    description: 'API de YachakuqWasi para alojamiento estudiantil en Ayacucho (UNSCH).'
  },
  servers: [{ url: '/api' }],
  paths: {
    '/auth/register': { post: { summary: 'Registrar usuario' } },
    '/auth/login': { post: { summary: 'Iniciar sesion' } },
    '/housings': {
      get: { summary: 'Listar alojamientos aprobados' },
      post: { summary: 'Publicar un alojamiento (arrendador/admin)' }
    },
    '/admin/stats': { get: { summary: 'Estadisticas del panel (admin)' } },
    '/admin/documentos/pendientes': { get: { summary: 'Documentos pendientes de verificacion (admin)' } },
    '/admin/documentos/{id}': { put: { summary: 'Aprobar o rechazar un documento (admin)' } },
    '/admin/usuarios/{id}/bloquear': { put: { summary: 'Bloquear a un usuario (admin)' } }
  }
};

export default swaggerSpec;
