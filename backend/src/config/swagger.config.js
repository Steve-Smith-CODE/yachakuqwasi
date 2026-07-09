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
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
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
          paused_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Visibilidad propia del arrendador (independiente del status de moderacion). No nulo = oculto del explorador.'
          },
          deleted_at: { type: 'string', format: 'date-time', nullable: true, description: 'Soft delete. No nulo = eliminado por el arrendador, recuperable via /restaurar.' },
          delete_reason: { type: 'string', enum: ['rented', 'data_changed', 'other'], nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      UpdateHousingRequest: {
        type: 'object',
        description: 'Todos los campos son opcionales; solo se actualizan los enviados. Cambiar price_pen/address/contactPhone/neighborhood en una publicacion approved la regresa a pending.',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          pricePen: { type: 'number', minimum: 0 },
          distanceToUnschMinutes: { type: 'integer', minimum: 0 },
          neighborhood: { type: 'string' },
          address: { type: 'string' },
          type: { type: 'string', enum: ['room', 'apartment', 'shared', 'family'] },
          amenities: { type: 'array', items: { type: 'string' } },
          contactPhone: { type: 'string' }
        }
      },
      SetVisibilityRequest: {
        type: 'object',
        required: ['paused'],
        properties: {
          paused: { type: 'boolean', description: 'true = pausar (ocultar del explorador), false = publicar de nuevo' }
        }
      },
      DeleteHousingRequest: {
        type: 'object',
        properties: {
          reason: { type: 'string', enum: ['rented', 'data_changed', 'other'], nullable: true }
        }
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid', nullable: true },
          actor_name: { type: 'string' },
          action: { type: 'string' },
          details: { type: 'string', nullable: true },
          type: { type: 'string', enum: ['system', 'user', 'listing', 'landlord_activity', 'favorite'] },
          listing_id: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      SetRoleRequest: {
        type: 'object',
        required: ['rol'],
        properties: {
          rol: { type: 'string', enum: ['student', 'landlord', 'admin'] }
        }
      },
      AddFavoriteRequest: {
        type: 'object',
        required: ['listingId'],
        properties: {
          listingId: { type: 'string', format: 'uuid' }
        }
      },
      Favorite: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          listing_id: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      SubmitVerificationRequest: {
        type: 'object',
        required: ['image'],
        properties: {
          image: { type: 'string', description: 'Data URL base64 (data:image/jpeg;base64,...), maximo 5MB, jpeg/png/webp' }
        }
      },
      VerificationDocument: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          doc_url: { type: 'string', format: 'uri' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          comment: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          reviewed_at: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      MakiChatRequest: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1, maxLength: 2000, example: '¿Qué zonas son las más cercanas a la UNSCH?' },
          history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sender: { type: 'string', enum: ['user', 'maki'] },
                text: { type: 'string' }
              }
            }
          }
        }
      },
      MakiChatResponse: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          isSimulated: { type: 'boolean', description: 'true si ningun proveedor de IA estaba configurado y se uso una respuesta de respaldo' }
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
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          faculty: { type: 'string' },
          career: { type: 'string' }
        },
        description: 'Al menos un campo es obligatorio.'
      },
      UpdatePasswordRequest: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', minLength: 6, example: 'MiNuevaClave123!' }
        }
      },
      UpdateAvatarRequest: {
        type: 'object',
        required: ['image'],
        properties: {
          image: { type: 'string', description: 'Data URL base64 (data:image/png;base64,...) o base64 plano' }
        }
      },
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['student', 'landlord', 'admin'] },
          faculty: { type: 'string', nullable: true },
          career: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          avatar_url: { type: 'string', nullable: true },
          is_verified: { type: 'boolean' }
        }
      },
      StudentStats: {
        type: 'object',
        properties: {
          savedFavorites: { type: 'integer' },
          activeChats: { type: 'integer' }
        }
      },
      LandlordStats: {
        type: 'object',
        properties: {
          totalListings: { type: 'integer' },
          listingsByStatus: { type: 'object', additionalProperties: { type: 'integer' }, example: { approved: 3, pending: 1 } },
          favoritesReceived: { type: 'integer' },
          contactsReceived: { type: 'integer' }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          recipient_id: { type: 'string', format: 'uuid' },
          actor_id: { type: 'string', format: 'uuid', nullable: true },
          type: {
            type: 'string',
            enum: ['listing_approved', 'listing_flagged', 'listing_suspended', 'listing_pending_review']
          },
          title: { type: 'string' },
          body: { type: 'string', nullable: true },
          listing_id: { type: 'string', format: 'uuid', nullable: true },
          read_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      NotificationsResponse: {
        type: 'object',
        properties: {
          notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
          unreadCount: { type: 'integer' }
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
    '/auth/forgot-password': {
      post: {
        summary: 'Enviar correo de recuperacion de contraseña (Supabase Auth)',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } }
        },
        responses: {
          200: { description: 'Correo de recuperacion enviado (si el email existe)' },
          400: { $ref: '#/components/responses/BadRequest' }
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
    '/housings/mine': {
      get: {
        summary: 'Listar mis propias publicaciones (arrendador/admin), incluye pausadas, excluye eliminadas',
        tags: ['Housings'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de publicaciones del arrendador autenticado',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/HousingListing' } } } }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/housings/{id}': {
      get: {
        summary: 'Detalle publico de una publicacion aprobada (no pausada, no eliminada)',
        tags: ['Housings'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Publicacion encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/HousingListing' } } } },
          404: { description: 'No existe, no esta aprobada, esta pausada o fue eliminada' }
        }
      },
      patch: {
        summary: 'Editar mi propia publicacion (dueño o admin). Campos sensibles la regresan a pending.',
        tags: ['Housings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateHousingRequest' } } }
        },
        responses: {
          200: { description: 'Publicacion actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/HousingListing' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'La publicacion no existe o ya fue eliminada' }
        }
      },
      delete: {
        summary: 'Eliminar (soft delete) mi propia publicacion (dueño o admin). Recuperable via /restaurar.',
        tags: ['Housings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: false,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DeleteHousingRequest' } } }
        },
        responses: {
          200: { description: 'Publicacion marcada como eliminada', content: { 'application/json': { schema: { $ref: '#/components/schemas/HousingListing' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'La publicacion no existe o ya fue eliminada' }
        }
      }
    },
    '/housings/{id}/visibilidad': {
      patch: {
        summary: 'Pausar o publicar mi propia publicacion (independiente del status de moderacion)',
        tags: ['Housings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SetVisibilityRequest' } } }
        },
        responses: {
          200: { description: 'Visibilidad actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/HousingListing' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'La publicacion no existe o ya fue eliminada' }
        }
      }
    },
    '/housings/{id}/restaurar': {
      post: {
        summary: 'Deshacer la eliminacion de mi propia publicacion (undo)',
        tags: ['Housings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Publicacion restaurada (deleted_at = null)', content: { 'application/json': { schema: { $ref: '#/components/schemas/HousingListing' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'La publicacion no existe' }
        }
      }
    },
    '/housings/{id}/historial': {
      get: {
        summary: 'Historial de mis propias acciones sobre este anuncio (pausar/publicar/editar/eliminar/restaurar)',
        tags: ['Housings'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Entradas de auditoria tipo landlord_activity para este anuncio',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } } } }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'La publicacion no existe o ya fue eliminada' }
        }
      }
    },
    '/perfil': {
      get: {
        summary: 'Obtener mi propio perfil',
        tags: ['Perfil'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil actual, envuelto en { profile }', content: { 'application/json': { schema: { type: 'object', properties: { profile: { $ref: '#/components/schemas/Profile' } } } } } },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      },
      patch: {
        summary: 'Actualizar nombre/telefono/facultad/carrera de mi propio perfil',
        tags: ['Perfil'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } } }
        },
        responses: {
          200: { description: 'Perfil actualizado, envuelto en { profile }', content: { 'application/json': { schema: { type: 'object', properties: { profile: { $ref: '#/components/schemas/Profile' } } } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/perfil/password': {
      patch: {
        summary: 'Cambiar mi propia contraseña',
        tags: ['Perfil'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdatePasswordRequest' } } }
        },
        responses: {
          200: { description: 'Contraseña actualizada' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/perfil/avatar': {
      post: {
        summary: 'Subir/cambiar mi foto de perfil',
        tags: ['Perfil'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAvatarRequest' } } }
        },
        responses: {
          200: { description: 'Perfil actualizado con la nueva avatar_url, envuelto en { profile }', content: { 'application/json': { schema: { type: 'object', properties: { profile: { $ref: '#/components/schemas/Profile' } } } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/stats/estudiante': {
      get: {
        summary: 'KPIs del estudiante autenticado (favoritos, chats activos)',
        tags: ['Stats'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Conteos del estudiante', content: { 'application/json': { schema: { $ref: '#/components/schemas/StudentStats' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/stats/arrendador': {
      get: {
        summary: 'KPIs del arrendador autenticado (anuncios por estado, favoritos y contactos recibidos)',
        tags: ['Stats'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Conteos del arrendador', content: { 'application/json': { schema: { $ref: '#/components/schemas/LandlordStats' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/notificaciones': {
      get: {
        summary: 'Listar mis notificaciones (mas recientes primero, maximo 50) y el conteo de no leidas',
        tags: ['Notificaciones'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Notificaciones y conteo de no leidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/NotificationsResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/notificaciones/{id}/leer': {
      put: {
        summary: 'Marcar una notificacion propia como leida',
        tags: ['Notificaciones'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Notificacion actualizada, envuelta en { notification }' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { description: 'La notificacion no existe o no te pertenece' }
        }
      }
    },
    '/notificaciones/leer-todas': {
      put: {
        summary: 'Marcar todas mis notificaciones como leidas',
        tags: ['Notificaciones'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Notificaciones marcadas como leidas' },
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
    '/admin/habitaciones': {
      get: {
        summary: 'Listar todas las publicaciones sin filtrar por estado (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Todas las publicaciones, cualquier estado',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/HousingListing' } } } }
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
    },
    '/admin/usuarios': {
      get: {
        summary: 'Listar todos los usuarios registrados (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Todos los perfiles',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Profile' } } } }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/admin/usuarios/{id}/rol': {
      put: {
        summary: 'Cambiar el rol de un usuario (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SetRoleRequest' } } }
        },
        responses: {
          200: { description: 'Usuario actualizado, envuelto en { user }' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/admin/logs': {
      get: {
        summary: 'Registro de auditoria, separado por audiencia',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'scope',
            in: 'query',
            schema: { type: 'string', enum: ['admin', 'arrendadores'] },
            description: '"admin" = moderacion/usuarios (types system,user,listing). "arrendadores" = actividad de arrendadores + favoritos de estudiantes (types landlord_activity,favorite). Sin scope: todo, sin filtrar.'
          }
        ],
        responses: {
          200: {
            description: 'Ultimas 100 entradas, mas recientes primero',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } } } }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/favoritos': {
      get: {
        summary: 'Listar mis alojamientos favoritos',
        tags: ['Favoritos'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Alojamientos marcados como favoritos por el usuario autenticado',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/HousingListing' } } } }
          },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      },
      post: {
        summary: 'Marcar un alojamiento como favorito',
        tags: ['Favoritos'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddFavoriteRequest' } } }
        },
        responses: {
          201: { description: 'Favorito creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Favorite' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/favoritos/{listingId}': {
      delete: {
        summary: 'Quitar un alojamiento de mis favoritos',
        tags: ['Favoritos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'listingId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Favorito eliminado' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/verificacion': {
      post: {
        summary: 'Subir mi documento de identidad para verificacion (estudiante o arrendador)',
        tags: ['Verificacion'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitVerificationRequest' } } }
        },
        responses: {
          201: { description: 'Documento registrado con status = pending, envuelto en { documento }', content: { 'application/json': { schema: { type: 'object', properties: { documento: { $ref: '#/components/schemas/VerificationDocument' } } } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/maki/chat': {
      post: {
        summary: 'Conversar con el asistente de IA "Maki"',
        tags: ['Maki'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MakiChatRequest' } } }
        },
        responses: {
          200: { description: 'Respuesta de Maki', content: { 'application/json': { schema: { $ref: '#/components/schemas/MakiChatResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' }
        }
      }
    }
  }
};

export default swaggerSpec;
