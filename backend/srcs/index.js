// const fastify = require('fastify')({ logger: true });
import Fastify from 'fastify';
import userRoutes from './routes/users.js';
import cors from '@fastify/cors'

const fastify = Fastify({ logger: true});

// const sqlite3 = require('sqlite3').verbose();

// // Open or create the SQLite database file
// const db = new sqlite3.Database('./mydb.sqlite', (err) => {
//   if (err) return console.error('DB init error:', err.message);

//   db.run(`
//     CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY,
//       username TEXT,
//       password TEXT,
//       email TEXT
//     )
//   `, (err) => {
//     if (err) return console.error('Table creation failed:', err.message);
//     console.log('Users table ready');

//     //for development test users
//     db.run("INSERT INTO users (username, password, email) VALUES ('casi', '42', 'casi@hive.fi')");
//     db.run("INSERT INTO users (username, password, email) VALUES ('emmi', '42', 'emmi@hive.fi')");
//     db.run("INSERT INTO users (username, password, email) VALUES ('armin', '42', 'armin@hive.fi')");
//     db.run("INSERT INTO users (username, password, email) VALUES ('sahra', '42', 'sahra@hive.fi')");
//     db.run("INSERT INTO users (username, password, email) VALUES ('ryan', '42', 'ryan@hive.fi')");


//   });
// });

const start = async () => {
  try {
    
    // await fastify.register(require('@fastify/cors'), {
    //   origin: true, // this is needed for dev!!!! DON'T CHANGE
    // });

    await fastify.register(cors, {
      origin: true,
    });

    fastify.register(userRoutes);
    // // login user
    // fastify.post('/users/login', (request, reply) => {
    //   const { username, password } = request.body;
    //   db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, rows) => {
    //     if (err) {
    //       reply.status(500).send({ error: 'Database error' });
    //       return;
    //     }
    //     else if (!rows) {
    //       reply.status(400).send({ message: 'Invalid login credentials' });
    //       return;
    //     }
    //     reply.status(200).send({ message: 'Login successful' });
    //   });
    // });

    // // create user
    // fastify.post('/users/register', (request, reply) => {
    //   const { username, password, email } = request.body;
    //   db.get("SELECT * FROM users WHERE username = ?", [username], (err, rows) => {
    //     if (err) {
    //       reply.status(500).send({ error: 'Database error' });
    //       return;
    //     }
    //     else if (rows) {
    //       reply.status(400).send({ error: 'Username exists' });
    //       return;
    //     }
    //   });
    //   db.run("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [username, password, email], function (err) {
    //     if (err) {
    //       reply.status(500).send({ error: 'Database error' });
    //       return;
    //     }
    //     reply.status(200).send({ error: 'Username added' });
      
    //   });
    // });


    // // Route to fetch all users
    // fastify.get('/users/temp', (request, reply) => {
    //   db.all("SELECT * FROM users", [], (err, rows) => {
    //     if (err) {
    //       reply.status(500).send({ error: 'Database error' });
    //       return;
    //     }
    //     reply.send(rows);
    //   });
    // });

    // // Route to insert a user
    // fastify.post('/users/create', (request, reply) => {
    //   const { username, password } = request.body;
    //   db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function (err) {
    //     if (err) {
    //       reply.status(500).send({ error: 'Database error' });
    //       return;
    //     }
    //     reply.send({ message: 'User added successfully' });
    //   });
    // });
    
    
    fastify.get('/', async (request, reply) => {
      return { hello: 'world' };
    });
    
    fastify.get('/app/data', async (request, reply) => {
      return { hello: 'Hello from the awesome backend!' };
    });
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    console.log('Catch activated!!')
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
