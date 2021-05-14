const express = require('express');
const http = require('http');
const app = express();
const socketIo = require('socket.io');
const server = http.Server(app);
const ejs = require('ejs');
const { sign } = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const io = socketIo(server);

const PORT = 3000;

const secret = '68b79a491868b0fd15904091f2b2dc21';

const users = [];

const emails = [];

const connectedUsers = {};

app.engine('html', ejs.renderFile);
app.set('view engine', 'html');

app.use(express.json());

const handleVerifyUserValid = (request, response, next) => {
  const { id } = request.params;

  const user = users.find(user => user.id === id);

  if (!user) {
    return response.status(400).json({ message: 'Usuário inválido' });
  }

  request.user = user;

  return next();
};

app.post('/users', (request, response) => {
  const { name, email, password } = request.body;

  const userWithTheSameEmail = users.find(user => user.email === email);

  if (userWithTheSameEmail) {
    return response.status(401).json({ message: 'Este e-mail já existe!' });
  }

  const user = {
    id: uuid(),
    name,
    email,
    password,
  };

  users.unshift(user);

  return response.status(200).json(user);
});

app.post('/sessions', (request, response) => {
  const { email, password } = request.body;

  const user = users.find(user => user.email === email);

  if (!user) {
    return response.status(400).json({ message: 'Email ou senha inválida!' });
  }

  if (user.password !== password) {
    return response.status(400).json({ message: 'Email ou senha inválida!' });
  }

  const token = sign({}, secret, {
    expiresIn: '1d',
    subject: user.id,
  });

  const { password: _password, ...sanitizedUser } = user;

  return response.status(200).json({
    user: sanitizedUser,
    token,
  });
});

app.post('/emails/:id', handleVerifyUserValid, (request, response) => {
  const user = request.user;
  const { recipientEmail, subject, body } = request.body;

  if (user.email === recipientEmail) {
    return response
      .status(401)
      .json({ message: 'Você não pode enviar um email para você mesmo' });
  }

  const recipientUser = users.find(user => user.email === recipientEmail);

  if (!recipientUser) {
    return response
      .status(400)
      .json({ message: 'Endereço de e-mail inválido' });
  }

  const email = {
    id: uuid(),
    userEmail: user.email,
    userName: user.name,
    recipientEmail,
    subject,
    body,
  };

  emails.unshift(email);

  return response.status(200).json(email);
});

app.get('/emails/:id', handleVerifyUserValid, (request, response) => {
  const user = request.user;

  const userEmails = emails.filter(
    email => email.recipientEmail === user.email,
  );

  return response.status(200).json(userEmails);
});

app.get('/', (request, response) => {
  response.render('login');
});

app.get('/email.html', (request, response) => {
  response.render('email');
});

app.get('/cadastrar.html', (request, response) => {
  response.render('cadastrar');
});

app.use('/public', express.static(__dirname + '/public'));

io.on('connection', socket => {
  const { user_email } = socket.handshake.query;
  connectedUsers[user_email] = socket.id;

  socket.on('sent email', email => {
    const sentEmail = {
      ...email,
      id: uuid(),
    };

    const socketToEmit = connectedUsers[email.recipientEmail];

    if (!socketToEmit) return;

    socket.to(socketToEmit).emit('sent email', sentEmail);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
