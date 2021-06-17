const enviarBtn = document.querySelector('#submit-btn');
const aceitoText = document.querySelector('#label-infos');
const aceitoCheck = document.querySelector('#agreement');

new window.JustValidate('#evaluation-form', {
  rules: {
    nome: {
      required: true,
    },
    sobrenome: {
      required: true,
    },
    email: {
      required: true,
      email: true,
    },
    casa: {
      required: true,
    },
    radio: {
      required: true,
    },
    radio2: {
      required: true,
    },
    textarea: {
      maxLength: 500,
    },
    agree: {
      required: true,
    },
  },
  messages: {
    nome: {
      required: 'Preencha este campo.',
    },
    sobrenome: {
      required: 'Preencha este campo.',
    },
    email: {
      required: 'Preencha este campo.',
      email: 'Digite um email válido',
    },
    casa: {
      required: 'Escolha uma casa.',
    },
    radio: {
      required: 'Escolha uma família.',
    },
    radio2: {
      required: 'Escolha uma nota.',
    },
    textarea: {
      required: 'Preencha este campo.',
    },
    agree: {
      required: 'Concorde com o uso das informações.',
    },
    textarea: {
      maxLength: 'Máximo de 500 caracteres.',
    },
  },

  focusWrongField: true,

  submitHandler(form, values, ajax) {
    ajax({
      url: 'https://just-validate-api.herokuapp.com/submit',
      method: 'POST',
      data: values,
      async: true,
      callback(response) {
        alert('Formulário enviado! \nResposta do servidor:' + response);
      },
      error(response) {
        alert(`AJAX submit error! \nResposta do servidor:${response}`);
      },
    });
  },

  invalidFormCallback(errors) {
    console.log(errors);
  },
});

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
