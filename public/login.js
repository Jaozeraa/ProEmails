const signUpForm = document.getElementById('signin-form');

signUpForm.addEventListener('submit', handleSubmit);

async function handleSubmit(event) {
  event.preventDefault();

  const email = document.querySelector('.email').value;
  const password = document.querySelector('.password').value;

  const body = {
    email,
    password,
  };

  const response = await fetch('http://localhost:3000/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json();

    if (data.message === 'Email ou senha inválida!') {
      return alert(data.message);
    }
    return alert('Houve um erro ao entrar na sua conta! Tente novamente');
  }

  const data = await response.json();

  Cookies.set('user', JSON.stringify(data.user), { expires: 1 });
  Cookies.set('token', JSON.stringify(data.token), { expires: 1 });

  window.location = '/email.html';
}
