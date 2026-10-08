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

        // Envío del formulario con Simulación de Roles (RBAC)
        document.getElementById("formLogin").addEventListener("submit", (e) => {
            e.preventDefault();

            // Leemos lo que escribió el usuario y lo pasamos a minúsculas para evitar errores
            const usuarioIngresado = inputUsuario.value.trim().toLowerCase();

            localStorage.setItem("sesionActiva", "true");

            // Si el usuario es 'admin' o 'bienestar', lo mandamos al panel institucional
            if (usuarioIngresado === "admin" || usuarioIngresado === "bienestar") {
                localStorage.setItem("rol", "administrador");
                window.location.href = "Usuarios/dashboard_admin.html";
            }
            // Si es cualquier otra matrícula, es un estudiante
            else {
                localStorage.setItem("rol", "alumno");
                // Opcional: guardamos su matrícula como nombre temporal para el saludo
                if(!localStorage.getItem("nombreAlumno")) {
                    localStorage.setItem("nombreAlumno", inputUsuario.value.trim());
                }
                window.location.href = "Usuarios/dashboard_alumno.html";
            }
        });