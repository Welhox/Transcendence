// Schemas for validating input data


// This schema is used to validate the id for deleting a user
export const deleteUserSchema = {
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
  
  

export const getUserByEmailSchema = {
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
	  404: {
		type: 'object',
		properties: {
		  error: { type: 'string' }
		}
	  }
	}
  };


// might want to add validation for username later, if not enforced earlier
//username: { type: 'string', minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_]+$' }
export const getUserByUsernameSchema = {
	querystring: {
	  type: 'object',
	  properties: {
		username: { type: 'string' }
	  },
	  required: ['username']
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
	  404: {
		type: 'object',
		properties: {
		  error: { type: 'string' }
		}
	  }
	}
  };

// This schema is used to validate the id for getting a user by id
  export const getUserByIdSchema = {
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
	  404: {
		type: 'object',
		properties: {
		  error: { type: 'string' }
		}
	  }
	}
  };

// This schema is used to validate the input data for registering a user
  export const registerUserSchema = {
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
	  201: { // = created
		type: 'object',
		properties: {
		  message: { type: 'string' }
		}
	  },
	  400: {
		type: 'object',
		properties: {
		  error: { type: 'string' }
		}
	  },
	  500: {
		type: 'object',
		properties: {
		  error: { type: 'string' }
		}
	  }
	}
  };

  export const loginUserSchema = {
  body: {
	type: 'object',
	properties: {
	  username: { type: 'string', minLength: 1 },
	  password: { type: 'string', minLength: 1 }
	},
	required: ['username', 'password']
  },
  response: {
	200: { 
	  type: 'object',
	  properties: {
		message: { type: 'string' },
		mfaRequired: { type: 'boolean' }
	  }
	},
	400: {
	  type: 'object',
	  properties: {
		error: { type: 'string' }
	  }
	},
	401: {
		type: 'object',
		properties: {
		  error: { type: 'string' }
		}
	  },
	500: {
	  type: 'object',
	  properties: {
		error: { type: 'string' }
	  }
	}
  }
};
  