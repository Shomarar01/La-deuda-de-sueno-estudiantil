document.addEventListener("DOMContentLoaded", () => {
        // Revisamos si el alumno "inició sesión" simuladamente
        const estaLogueado = localStorage.getItem("sesionActiva") === "true";
        const contenedorEnlaces = document.querySelector(".nav-enlaces");

        if (estaLogueado) {
            // Reemplazamos los botones por el menú de usuario activo
            contenedorEnlaces.innerHTML = `
                <a href="cuestionario.html" class="nav-btn-cuestionario">Evalúa tu descanso</a>
                <span class="separador">|</span>
                <a href="dashboard_alumno.html" style="color: var(--texto-principal); text-decoration: none; margin-right: 15px; font-weight: 500;">
                    <i class="fas fa-user-circle"></i> Mi Perfil
                </a>
                <a href="#" id="btnCerrarSesion" style="color: var(--texto-secundario); text-decoration: none;">Salir</a>
            `;

            // Lógica para cerrar sesión
            document.getElementById("btnCerrarSesion").addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.removeItem("sesionActiva");
                localStorage.removeItem("nombreAlumno");
                window.location.reload(); // Recarga la página y vuelven a aparecer los botones de Login
            });
        }
    });