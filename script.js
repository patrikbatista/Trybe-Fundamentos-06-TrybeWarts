const enviarBtn = document.querySelector('#submit-btn');
const aceitoText = document.querySelector('#label-infos');
const aceitoCheck = document.querySelector('#agreement');

function handler() {
  const concordo = document.querySelectorAll('input[name="concordo"]:checked');
  if (concordo.length !== 0) {
    enviarBtn.disabled = false;
  } else {
    enviarBtn.disabled = true;
  }
}

const login = document.getElementById('input-login');
const senha = document.getElementById('input-senha');
const logar = document.querySelector('#header-button');

logar.addEventListener('click', () => {
  if ((login.value === 'tryber@teste.com') && (senha.value === '123456')) {
    alert('Olá, Tryber!');
  } else {
    alert('Login ou senha inválidos.');
  }
});
aceitoCheck.addEventListener('click', handler);
aceitoText.addEventListener('click', handler);
