let login = document.getElementById("input-login");
let senha = document.getElementById("input-senha");
let logar = document.querySelector("#header-button");

logar.addEventListener("click", function() {
  if ((login.value === "tryber@teste.com") && (senha.value === "123456")) {
    alert("Olá, Tryber!");
  } else {
    alert("Login ou senha inválidos.");
  }

})
