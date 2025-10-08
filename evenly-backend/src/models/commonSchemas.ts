export const CommonSchemas = {
  User: {
    type: 'object' as const,
    properties: {
      id: { type: 'string' as const, format: 'uuid' },
      email: { type: 'string' as const, format: 'email' },
      firstName: { type: 'string' as const },
      lastName: { type: 'string' as const },
      profilePicture: { type: 'string' as const },
      createdAt: { type: 'string' as const, format: 'date-time' },
      updatedAt: { type: 'string' as const, format: 'date-time' },
    },
  },

  ApiResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      data: { type: 'object' },
    },
  },

  PaginatedResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      data: {
        type: 'array',
        items: { type: 'object' },
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
          total: { type: 'number' },
          totalPages: { type: 'number' },
        },
      },
    },
  },

  ErrorResponse: {
    type: 'object',
    properties: {
      statusCode: { type: 'number' },
      error: { type: 'string' },
      message: { type: 'string' },
      details: { type: 'array', items: { type: 'object' } },
    },
  },

  ValidationError: {
    type: 'object',
    properties: {
      field: { type: 'string' },
      message: { type: 'string' },
      value: { type: 'string' },
    },
  },
};
