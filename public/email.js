(async () => {
  const signoutButton = document.getElementById('signout-button');
  const modalButtons = document.querySelectorAll('#modal-button');
  const emailsWrapper = document.querySelector('.emails-container');
  const formSendMail = document.getElementById('send-mail');
  formSendMail.addEventListener('submit', handleSendEmail);

  const modal = document.querySelector('.modal');
  modalButtons.forEach(button => {
    button.addEventListener('click', handleToggleModal);
  });
  signoutButton.addEventListener('click', handleSignOut);

  modal.style.display === 'none';

  let user;

  let emails = [];

  verifyToken();
  await getEmails();
  loadData();

  const socket = io('http://localhost:3000', {
    query: {
      user_email: user.email,
    },
  });

  socket.on('sent email', email => {
    const divElement = document.createElement('div');

    const emailElement = createEmail(divElement, email);

    emailsWrapper.appendChild(emailElement);

    addListenerToShowMoreClick();
    emails.unshift(email);
    updateHeader();
  });

  function verifyToken() {
    userCookie = Cookies.get('user');

    if (!userCookie) {
      alert('Você não está autenticado.');
      return (window.location = '/');
    }

    user = JSON.parse(userCookie);
  }

  async function getEmails() {
    const response = await fetch(`http://localhost:3000/emails/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      if (data.message === 'Usuário inválido') {
        return handleSignOut();
      }
      return alert('Houve um erro ao carregar seus e-mails! Atualize a página');
    }

    emails = data;
  }

  function handleSignOut() {
    Cookies.remove('user');
    Cookies.remove('token');
    window.location = '/';
  }

  function loadData() {
    updateHeader();

    emails.forEach(email => {
      const divElement = document.createElement('div');

      const emailElement = createEmail(divElement, email);

      emailsWrapper.appendChild(emailElement);
    });

    addListenerToShowMoreClick();
  }

  function handleToggleModal() {
    if (modal.style.display === 'flex') {
      const recipientEmail = document.querySelector('.recipientEmail').value;
      const subject = document.querySelector('.subject').value;
      const message = document.querySelector('.body').value;

      document.querySelector('.recipientEmail').value = '';
      document.querySelector('.subject').value = '';
      document.querySelector('.body').value = '';

      return (modal.style.display = 'none');
    }

    return (modal.style.display = 'flex');
  }

  async function handleSendEmail(event) {
    event.preventDefault();

    const recipientEmail = document.querySelector('.recipientEmail').value;
    const subject = document.querySelector('.subject').value;
    const message = document.querySelector('.body').value;

    const body = {
      userName: user.name,
      userEmail: user.email,
      recipientEmail,
      subject,
      body: message,
    };

    socket.emit('sent email', body);

    const response = await fetch(`http://localhost:3000/emails/${user.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();

      if (
        data.message === 'Você não pode enviar um email para este end' ||
        data.message === 'Endereço de e-mail inválido'
      ) {
        return alert(data.message);
      }
      return alert('Houve um erro ao enviar seu e-mail! Tente novamente');
    }

    modal.style.display = 'none';

    document.querySelector('.recipientEmail').value = '';
    document.querySelector('.subject').value = '';
    document.querySelector('.body').value = '';

    return alert('E-mail enviado com sucesso!');
  }

  function createEmail(element, email) {
    element.classList.add('email');

    element.innerHTML = `
      <section>
        <div>
          <h1>${email.subject}</h1>
          <p>${email.userEmail} (${email.userName})</p>
        </div>
        <button id="more">
          <img src="public/assets/chevron-down.svg" alt="Sair" />
        </button>
      </section>
      <p>
        ${email.body}
      </p>
    `;

    return element;
  }

  function addListenerToShowMoreClick() {
    const moreButtonInEmails = document.querySelectorAll('#more');

    moreButtonInEmails.forEach(moreButton => {
      moreButton.addEventListener('click', event => {
        const { parentNode } = event.target;
        const parentNodeId = parentNode.id;
        if (parentNodeId === 'more') {
          parentNode.id = 'less';
          parentNode.parentNode.parentNode.querySelector(
            '.email > p',
          ).style.display = 'block';
        } else {
          parentNode.id = 'more';
          parentNode.parentNode.parentNode.querySelector(
            '.email > p',
          ).style.display = 'none';
        }
      });
    });
  }

  function updateHeader() {
    const headerUser = document.querySelector('.header-name');
    const headerNumberEmails = document.querySelector('.number-emails');
    headerUser.innerText = user.name.split(' ').splice(0, 2).join(' ');
    if (emails.length === 0) {
      return (headerNumberEmails.innerText = `Você não possui nenhum e-mail`);
    }
    headerNumberEmails.innerText =
      emails.length > 1
        ? `Você possui ${emails.length} novos e-mails`
        : `Você possui ${emails.length} novo e-mail`;

    document.title = `(${
      emails.length <= 99 ? emails.length : 99
    }) Caixa de entrada || ProEmails`;
  }
})();
