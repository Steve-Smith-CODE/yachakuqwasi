const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'API - Alquileres UNSCH',
    version: '1.0.0',
    description: 'API de YachakuqWasi para alojamiento estudiantil en Ayacucho (UNSCH).'
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token devuelto por POST /auth/login (campo "token").'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          status: { type: 'integer' },
          details: { type: 'object', nullable: true }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'estudiante@unsch.edu.pe' },
          password: { type: 'string', minLength: 6, example: 'MiClaveSegura123!' },
          name: { type: 'string', example: 'Ana Quispe' },
          role: { type: 'string', enum: ['student', 'landlord', 'admin'], example: 'student' },
          faculty: { type: 'string', nullable: true },
          career: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true }
        }
      },
      RegisterResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              role: { type: 'string', enum: ['student', 'landlord', 'admin'] }
            }
          }
        }
      },
      CreateHousingRequest: {
        type: 'object',
        required: ['title', 'pricePen', 'distanceToUnschMinutes', 'neighborhood', 'address', 'contactPhone'],
        properties: {
          title: { type: 'string', example: 'Cuarto amoblado cerca a la UNSCH' },
          description: { type: 'string', nullable: true },
          pricePen: { type: 'number', minimum: 0, example: 250 },
          distanceToUnschMinutes: { type: 'integer', minimum: 0, example: 8 },
          neighborhood: { type: 'string', example: 'San Blas' },
          address: { type: 'string', example: 'Jr. Tres Máscaras 142' },
          type: { type: 'string', enum: ['room', 'apartment', 'shared', 'family'], example: 'room' },
          amenities: { type: 'array', items: { type: 'string' }, example: ['Wi-Fi', 'Agua 24h'] },
          contactPhone: { type: 'string', example: '+51987654321' },
          images: { type: 'array', items: { type: 'string', format: 'uri' } }
        }
      },
      HousingListing: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          landlord_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          type: { type: 'string', enum: ['room', 'apartment', 'shared', 'family'] },
          price_pen: { type: 'number' },
          distance_to_unsch_minutes: { type: 'integer' },
          neighborhood: { type: 'string' },
          address: { type: 'string' },
          description: { type: 'string', nullable: true },
          contact_phone: { type: 'string' },
          amenities: { type: 'array', items: { type: 'string' } },
          images: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['pending', 'approved', 'suspended', 'flagged'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Stats: {
        type: 'object',
        properties: {
          totalUsers: { type: 'integer' },
          totalHousings: { type: 'integer' },
          pendingDocuments: { type: 'integer' }
        }
      },
      ReviewDocRequest: {
        type: 'object',
        required: ['estado'],
        properties: {
          estado: { type: 'string', enum: ['approved', 'rejected'] },
          comentario: { type: 'string', nullable: true }
        }
      },
      HousingStatusRequest: {
        type: 'object',
        required: ['estado'],
        properties: {
          estado: { type: 'string', enum: ['approved', 'flagged', 'suspended'] }
        }
      },
      BlockUserRequest: {
        type: 'object',
        required: ['motivo'],
        properties: {
          motivo: { type: 'string', example: 'Publicaciones fraudulentas' },
          dias: { type: 'integer', minimum: 1, nullable: true, example: 7 }
        }
      },
      UploadImagesRequest: {
        type: 'object',
        required: ['images'],
        properties: {
          images: {
            type: 'array',
            minItems: 1,
            maxItems: 8,
            items: { type: 'string', description: 'Data URL base64 (data:image/png;base64,...) o base64 plano' },
            example: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=']
          }
        }
      },
      LifestyleProfile: {
        type: 'object',
        required: ['fumador', 'mascotas', 'horario', 'presupuestoMax'],
        properties: {
          fumador: { type: 'boolean' },
          mascotas: { type: 'boolean' },
          horario: { type: 'string', enum: ['diurno', 'nocturno'] },
          presupuestoMax: { type: 'number', example: 500 }
        }
      },
      CompatibilityRequest: {
        type: 'object',
        required: ['profileA', 'profileB'],
        properties: {
          profileA: { $ref: '#/components/schemas/LifestyleProfile' },
          profileB: { $ref: '#/components/schemas/LifestyleProfile' }
        }
      },
      StartChatRequest: {
        type: 'object',
        required: ['landlordId', 'listingId'],
        properties: {
          landlordId: { type: 'string', format: 'uuid' },
          listingId: { type: 'string', format: 'uuid' }
        }
      },
      SendMessageRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1, maxLength: 4000, example: '¿Sigue disponible el cuarto?' }
        }
      },
      Chat: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          student_id: { type: 'string', format: 'uuid' },
          landlord_id: { type: 'string', format: 'uuid' },
          listing_id: { type: 'string', format: 'uuid', nullable: true },
          last_message: { type: 'string', nullable: true },
          unread: { type: 'boolean' },
          status: { type: 'string', enum: ['online', 'offline'] }
        }
      },
      ChatMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          chat_id: { type: 'string', format: 'uuid' },
          sender: { type: 'string', enum: ['student', 'landlord'] },
          text: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Solicitud inválida (validación fallida)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      Unauthorized: {
        description: 'No autenticado (falta o es inválido el token Bearer)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      Forbidden: {
        description: 'Autenticado pero sin el rol requerido',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Registrar usuario',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } }
        },
        responses: {
          201: {
            description: 'Usuario creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterResponse' } } }
          },
          400: { $ref: '#/components/responses/BadRequest' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Iniciar sesion',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/housings': {
      get: {
        summary: 'Listar alojamientos aprobados',
        tags: ['Housings'],
        parameters: [
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['room', 'apartment', 'shared', 'family'] } },
          { name: 'precio_max', in: 'query', schema: { type: 'number' }, description: 'Precio mensual maximo en soles' },
          { name: 'barrio', in: 'query', schema: { type: 'string' }, example: 'San Blas' }
        ],
        responses: {
          200: {
            description: 'Lista de alojamientos con status = approved',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/HousingListing' } } }
            }
          }
        }
      },
      post: {
        summary: 'Publicar un alojamiento (arrendador/admin)',
        tags: ['Housings'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateHousingRequest' } } }
        },
        responses: {
          201: {
            description: 'Alojamiento creado con status = pending',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HousingListing' } } }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/housings/{id}/imagenes': {
      post: {
        summary: 'Subir fotos de una publicacion a Supabase Storage (dueño o admin)',
        tags: ['Housings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UploadImagesRequest' } } }
        },
        responses: {
          200: {
            description: 'Publicacion actualizada con las nuevas URLs de imagen',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HousingListing' } } }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'La publicacion no existe' }
        }
      }
    },
    '/roommates/compatibilidad': {
      post: {
        summary: 'Calcular score de compatibilidad entre dos perfiles de estilo de vida',
        tags: ['Roommates'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CompatibilityRequest' } } }
        },
        responses: {
          200: {
            description: 'Score entre 0 y 1',
            content: { 'application/json': { schema: { type: 'object', properties: { score: { type: 'number', example: 0.8 } } } } }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/chats': {
      post: {
        summary: 'Iniciar (o reutilizar) un chat con un arrendador sobre una publicacion (solo estudiantes)',
        tags: ['Chats'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/StartChatRequest' } } }
        },
        responses: {
          201: { description: 'Chat creado o existente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Chat' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      get: {
        summary: 'Listar mis chats (como estudiante o como arrendador)',
        tags: ['Chats'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de chats',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Chat' } } } }
          },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/chats/{id}/messages': {
      get: {
        summary: 'Listar los mensajes de un chat (solo participantes)',
        tags: ['Chats'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Mensajes ordenados por fecha',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } } } }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'No participas en este chat' },
          404: { description: 'El chat no existe' }
        }
      },
      post: {
        summary: 'Enviar un mensaje en un chat (solo participantes)',
        tags: ['Chats'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SendMessageRequest' } } }
        },
        responses: {
          201: { description: 'Mensaje enviado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatMessage' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'No participas en este chat' },
          404: { description: 'El chat no existe' }
        }
      }
    },
    '/admin/stats': {
      get: {
        summary: 'Estadisticas del panel (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Conteos generales', content: { 'application/json': { schema: { $ref: '#/components/schemas/Stats' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/admin/documentos/pendientes': {
      get: {
        summary: 'Documentos pendientes de verificacion (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de documentos con status = pending' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/admin/documentos/{id}': {
      put: {
        summary: 'Aprobar o rechazar un documento (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewDocRequest' } } }
        },
        responses: {
          200: { description: 'Documento actualizado, envuelto en { documento }' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/admin/habitaciones/pendientes': {
      get: {
        summary: 'Listar habitaciones pendientes de aprobacion (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de habitaciones con status = pending',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/HousingListing' } } }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/admin/habitaciones/{id}/estado': {
      put: {
        summary: 'Aprobar, marcar o suspender una habitacion (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/HousingStatusRequest' } } }
        },
        responses: {
          200: { description: 'Habitacion actualizada, envuelta en { listing }' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/admin/usuarios/{id}/bloquear': {
      put: {
        summary: 'Bloquear a un usuario (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BlockUserRequest' } } }
        },
        responses: {
          200: { description: 'Usuario bloqueado' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    }
  }
};

export default swaggerSpec;
