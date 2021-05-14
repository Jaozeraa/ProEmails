const signUpForm = document.getElementById('signup-form');

signUpForm.addEventListener('submit', handleSubmit);

async function handleSubmit(event) {
  event.preventDefault();

  const name = document.querySelector('.name').value;
  const email = document.querySelector('.email').value;
  const password = document.querySelector('.password').value;
  const confirm_password = document.querySelector('.confirm_password').value;

  if (confirm_password !== password) {
    return alert('As senhas não coincidem!');
  }

  const body = {
    name,
    email,
    password,
  };

  const response = await fetch('http://localhost:3000/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json();

    if (data.message === 'Este e-mail já existe!') {
      return alert(data.message);
    }
    return alert('Houve um erro ao criar sua conta! Tente novamente');
  }

  window.location = '/';
  return alert('Conta criada com sucesso!');
}
