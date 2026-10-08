const inputUsuario = document.getElementById("usuario");
        const errorUsuario = document.getElementById("errorUsuario");
        const inputNombre = document.getElementById("nombreAlumno");
        
        const inputPass = document.getElementById("password");
        const inputConfirm = document.getElementById("confirmPassword");
        const mensajeError = document.getElementById("mensajeError");
        inputNombre.value.trim() !== ""
        
        const btnEnviar = document.getElementById("btnEnviar");

        let usuarioTocado = false; // Variable para saber si ya interactuó con el campo

        function validarFormulario() {
            const usuario = inputUsuario.value.trim();
            const pass = inputPass.value;
            const confirm = inputConfirm.value;

            let contrasenasValidas = false;
            let usuarioValido = usuario !== "";

            // Validación de Usuario (Solo muestra error si ya tocó el campo y lo dejó vacío)
            if (usuarioTocado && !usuarioValido) {
                errorUsuario.textContent = "✖ La matrícula es obligatoria";
                errorUsuario.style.color = "#f87171"; // Rojo error
                inputUsuario.classList.add("input-error");
            } else {
                errorUsuario.textContent = "";
                inputUsuario.classList.remove("input-error");
            }

            // Validación de Contraseñas
            if (confirm.length > 0) {
                if (pass === confirm) {
                    mensajeError.textContent = "✔ Las contraseñas coinciden";
                    mensajeError.style.color = "#4ade80"; // Verde éxito
                    inputConfirm.classList.remove("input-error");
                    contrasenasValidas = true;
                } else {
                    mensajeError.textContent = "✖ Las contraseñas no coinciden";
                    mensajeError.style.color = "#f87171"; 
                    inputConfirm.classList.add("input-error");
                }
            } else {
                mensajeError.textContent = "";
                inputConfirm.classList.remove("input-error");
            }

            // Habilitar botón solo si todo es correcto
            if (contrasenasValidas && usuarioValido) {
                btnEnviar.disabled = false;
            } else {
                btnEnviar.disabled = true;
            }
        }

        // detecta cuando el usuario sale del campo de matrícula
        inputUsuario.addEventListener("blur", () => {
            usuarioTocado = true;
            validarFormulario();
        });

        //cambios en tiempo real
        inputUsuario.addEventListener("input", validarFormulario);
        inputPass.addEventListener("input", validarFormulario);
        inputConfirm.addEventListener("input", validarFormulario);

        // Envío del formulario
        document.getElementById("formRegistro").addEventListener("submit", (e) => {
            e.preventDefault();
            alert("¡Registro exitoso! Bienvenido a la plataforma de Bienestar Estudiantil.");
            window.location.href = "index.html";
        });

        // Asegúrate de tener capturados los inputs al inicio del script
        const inputPassRegistro = document.getElementById("passwordRegistro"); // Asegúrate de que el ID coincida
        const btnRegistrar = document.getElementById("btnRegistrar");
        const mensajeErrorPass = document.getElementById("errorPass"); // Un div vacío debajo del input de password

        function validarRegistro() {
            const nombre = inputNombre.value.trim().toLowerCase();
            const pass = inputPassRegistro.value.trim().toLowerCase();

            let esValido = true;
            mensajeErrorPass.textContent = ""; // Limpiamos errores previos

            // Validación: La contraseña no puede contener el nombre
            if (nombre !== "" && pass !== "" && pass.includes(nombre)) {
                mensajeErrorPass.textContent = "Por seguridad, la contraseña no puede ser igual ni contener tu nombre.";
                mensajeErrorPass.style.color = "var(--color-alerta)";
                esValido = false;
            }

            // Aquí irían tus otras validaciones (ej. que las contraseñas coincidan)

            // Habilitar o deshabilitar botón
            btnRegistrar.disabled = !esValido;
        }

        // Escuchar cambios
        inputNombre.addEventListener("input", validarRegistro);
        inputPassRegistro.addEventListener("input", validarRegistro);

        // Al simular el registro exitoso:
        document.getElementById("formRegistro").addEventListener("submit", (e) => {
            e.preventDefault();
            localStorage.setItem("sesionActiva", "true"); // Lo "logueamos" automáticamente
            localStorage.setItem("nombreAlumno", inputNombre.value); // Guardamos su nombre real
            window.location.href = "cuestionario.html"; // Lo mandamos directo a evaluarse
        });
