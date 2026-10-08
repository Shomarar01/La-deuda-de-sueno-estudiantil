const inputUsuario = document.getElementById("usuarioLogin");
        const inputPass = document.getElementById("passwordLogin");
        const btnIngresar = document.getElementById("btnIngresar");
        const btnMostrar = document.getElementById("btnMostrar");

        // Lógica para Mostrar/Ocultar contraseña
        btnMostrar.addEventListener("click", () => {
            const tipo = inputPass.getAttribute("type") === "password" ? "text" : "password";
            inputPass.setAttribute("type", tipo);
            btnMostrar.textContent = tipo === "password" ? "Mostrar" : "Ocultar";
        });

        // Lógica de habilitar el botón
        function validarLogin() {
            if (inputUsuario.value.trim() !== "" && inputPass.value.trim() !== "") {
                btnIngresar.disabled = false;
            } else {
                btnIngresar.disabled = true;
            }
        }

        inputUsuario.addEventListener("input", validarLogin);
        inputPass.addEventListener("input", validarLogin);

        // Envío del formulario
        document.getElementById("formLogin").addEventListener("submit", (e) => {
            e.preventDefault();
            // ¡MAGIA DE SESIÓN SIMULADA! Guardamos en el navegador que ya inició sesión
            localStorage.setItem("sesionActiva", "true");
            window.location.href = "dashboard_alumno.html";
        });