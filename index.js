    document.addEventListener("DOMContentLoaded", () => {
        const estaLogueado = localStorage.getItem("sesionActiva") === "true";
        const rolUsuario = localStorage.getItem("rol"); // Leemos si es admin o alumno
        const contenedorEnlaces = document.querySelector(".nav-enlaces");

        if (estaLogueado) {

            if (rolUsuario === "administrador") {
                // Menú para Coordinadores / Administrador
                contenedorEnlaces.innerHTML = `
                    <a href="Usuarios/dashboard_admin.html" style="color: var(--color-ambar); text-decoration: none; margin-right: 15px; font-weight: 600;">
                        <i class="fas fa-shield-alt"></i> Panel Institucional
                    </a>
                    <a href="#" id="btnCerrarSesionGlobal" class="btn-salir">Salir</a>
                `;
            } else {
                // Menú para Alumnos
                contenedorEnlaces.innerHTML = `
                    <a href="cuestionario.html" class="nav-btn-cuestionario">Evalúa tu descanso</a>
                    <span class="separador">|</span>
                    <a href="Usuarios/dashboard_alumno.html" style="color: var(--texto-principal); text-decoration: none; margin-right: 15px; font-weight: 500;">
                        <i class="fas fa-user-circle"></i> Mi Perfil
                    </a>
                    <a href="#" id="btnCerrarSesionGlobal" class="btn-salir">Salir</a>
                `;
            }

            // Lógica universal para cerrar sesión
            document.getElementById("btnCerrarSesionGlobal").addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.clear(); // Esto borra la sesión, el rol y el nombre de un solo golpe
                window.location.reload();
            });
        }
    });