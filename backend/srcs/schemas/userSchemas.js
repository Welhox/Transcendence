// Schemas for validating input data

// This schema is used to validate the id for deleting a user
const deleteUserSchema = {
	params: {
	  type: 'object',
	  properties: {
		id: { type: 'integer', minimum: 1 },
	  },
	  required: ['id'],
	},
	response: {
	  200: { type: 'object', properties: { message: { type: 'string' } } },
	  400: { type: 'object', properties: { error: { type: 'string' } } },
	  404: { type: 'object', properties: { error: { type: 'string' } } },
	},
  };


  // This schema is used to validate the id and password for deleteing a user
const deleteUserSchemaPost = {
	params: {
	  type: 'object',
	  properties: {
		id: { type: 'integer', minimum: 1 },
	  },
	  required: ['id'],
	},
	body: {
		type: 'object',
		properties: {
			password: { type: 'string', minLength: 2, maxLength: 30} //set minlength to 6 for PROD!!!
		},
		required: ['password']
	},
	response: {
	  200: { type: 'object', properties: { message: { type: 'string' } } },
	  400: { type: 'object', properties: { error: { type: 'string' } } },
	  404: { type: 'object', properties: { error: { type: 'string' } } },
	  500: { type: 'object', properties: { error: { type: 'string' } } },
	},
  };

const logoutSchema = {
	response: {
	  200: { type: 'object', properties: { message: { type: 'string' } } },
	  404: { type: 'object', properties: { error: { type: 'string' } } },
	  500: { type: 'object', properties: { error: { type: 'string' } } },
	},
}

const usersBaseInfoSchema = {
	response: {
	  200: { type: 'object', properties: { 
		id: { type: 'integer'},
		username: { type: 'string'},
		email: { type: 'string', format: 'email'},
	  } },
	//   404: { type: 'object', properties: { error: { type: 'string' } } },
	//   500: { type: 'object', properties: { error: { type: 'string' } } },
	},
}


const getUserByEmailSchema = {
	querystring: {
	  type: 'object',
	  properties: {
		email: { type: 'string', format: 'email' }
	  },
	  required: ['email']
	},
	response: {
	  200: {
		type: 'object',
		properties: {
		  id: { type: 'integer' },
		  username: { type: 'string' },
		  email: { type: 'string', format: 'email' }
		}
	  },
	  404: {type: 'object',properties: {error: { type: 'string' }}},
	}
  };

const searchUsersSchema = {
  description: 'Search for users by username prefix, excluding a given user ID',
  tags: ['User'],
  querystring: {
    type: 'object',
    required: ['query'],
    properties: {
      query: {
        type: 'string',
        pattern: '^[a-zA-Z0-9]+$',
        description: 'Username prefix to search for'
      },
      excludeUserId: {
        type: 'integer',
        minimum: 1,
        description: 'User ID to exclude from search results'
      }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          username: { type: 'string' }
        },
        required: ['id', 'username']
      }
    }
  }
};

const getUserSettingsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        mfaInUse: { type: 'boolean' },
        email: { type: 'string', format: 'email' },
        language: { type: 'string' },
      },
      required: ['mfaInUse', 'email', 'language']
    },
	400: {type: 'object',properties: {error: { type: 'string' }}},
    404: {type: 'object',properties: {error: { type: 'string' }}},
    500: {type: 'object',properties: {error: { type: 'string' }}},
  }
};

const updateEmailActivationSchema = {
  body: {
	type: 'object',
	properties: {
	  emailVerified: { type: 'boolean' },
	},
	required: ['emailVerified']
  },
  response: {
	200: {
	  type: 'object',
	  properties: {
		message: { type: 'string' },
		emailVerified: { type: 'boolean' },
	  },
	  required: ['message', 'emailVerified'],
	},
	400: {type: 'object',properties: {error: { type: 'string' }}},
	// 404: {type: 'object',properties: {error: { type: 'string' }}},
	500: { type: 'object',properties: {error: { type: 'string' }}}
  }
};


const updateMfaSchema = {
  body: {
	type: 'object',
	properties: {
	  mfaInUse: { type: 'boolean' }
	},
	required: ['mfaInUse']
  },
  response: {
	200: {
	  type: 'object',
	  properties: {
		message: { type: 'string' },
		mfaInUse: { type: 'boolean' },
	  },
	  required: ['message', 'mfaInUse'],
	},
	400: {type: 'object', properties: {error: { type: 'string' }}},
	404: { type: 'object', properties: {error: { type: 'string' }}},
	500: { type: 'object',properties: {error: { type: 'string' }}},
  }
};	
	
  


const getUserFriendsByIdSchema = {
	params: {
	  type: 'object',
	  properties: {
		id: { type: 'integer', minimum: 1 },
	  },
	  required: ['id'],
	},
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'integer'},
					username: {type: 'string'},
					isOnline: {type: 'boolean'},
				},
				required: ['id', 'username', 'isOnline'],
			},
		},
		400: { type: 'object', properties: { error: {type: 'string'}}},
		404: { type: 'object', properties: { error: {type: 'string'}}},
		500: { type: 'object', properties: { error: {type: 'string'}}},
	}
};

const getFriendRequestByIdSchema = {
	params: {
		type: 'object',
		properties: {
			id: { type: 'integer', minimum: 1},
		},
		required: ['id'],
	},
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'integer'},
					senderId: { type: 'integer' },
					username: { type: 'string' },
				},
				required: ['id', 'senderId', 'username'],
			},
		},
	}
}

// might want to add validation for username later, if not enforced earlier
//username: { type: 'string', minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_]+$' }
const getUserByUsernameSchema = {
	querystring: { type: 'object', properties: { username: { type: 'string' }}, required: ['username']},
	response: {
	  200: {
		type: 'object',
		properties: {
		  id: { type: 'integer' },
		  username: { type: 'string' },
		  email: { type: 'string', format: 'email' }
		}
	  },
	  404: { type: 'object', properties: { error: { type: 'string' }}}
	}
};

const getEmailStatusSchema = {
	response: {
		200: {
			type: 'object',
			properties: {
				email: { type: 'string', format: 'email' },
				emailVerified: { type: 'boolean' }
			}
		},
		404: { type: 'object', properties: {error: { type: 'string' }}}
	}
}

// This schema is used to validate the id for getting a user by id
const getUserByIdSchema = {
	querystring: {
		type: 'object',
		properties: {
			id: { type: 'integer', minimum: 1 },
		},
		required: ['id'],
		},
	response: {
	  200: {
		type: 'object',
		properties: {
		  id: { type: 'integer' },
		  username: { type: 'string' },
		  email: { type: 'string', format: 'email' }
		}
	  },
	  404: { type: 'object', properties: { error: { type: 'string' }}}
	}
};

// This schema is used to validate the input data for registering a user
const registerUserSchema = {
	body: {
	  type: 'object',
	  properties: {
		username: { type: 'string', minLength: 3, maxLength: 30 },
		email: { type: 'string', format: 'email' },
		password: { type: 'string', minLength: 6 }
	  },
	  required: ['username', 'email', 'password']
	},
	response: {
	  201: { type: 'object', properties: { message: { type: 'string' }}},
	  400: { type: 'object', properties: { error: { type: 'string' }}},
	  500: { type: 'object', properties: { error: { type: 'string' }}}}};

const loginUserSchema = {
  body: {
	type: 'object',
	properties: {
	  username: { type: 'string', minLength: 1 },
	  password: { type: 'string', minLength: 1 }
	},
	required: ['username', 'password']
  },
  response: {
	200: { type: 'object', properties: { message: { type: 'string' }, mfaRequired: { type: 'boolean' }, language: { type: 'string'}}},
	400: { type: 'object', properties: { error: { type: 'string' }}},
	401: { type: 'object', properties: { error: { type: 'string' }}},
	500: { type: 'object', properties: { error: { type: 'string' }}}
	}
}

export const userSchemas = {
  deleteUserSchema,
  deleteUserSchemaPost,
  logoutSchema,
  usersBaseInfoSchema,
  getUserByEmailSchema,
  searchUsersSchema,
  getUserFriendsByIdSchema,
  getFriendRequestByIdSchema,
  getUserByUsernameSchema,
  getEmailStatusSchema,
  getUserByIdSchema,
  registerUserSchema,
  loginUserSchema,
  getUserSettingsSchema,
  updateEmailActivationSchema,
  updateMfaSchema
};
