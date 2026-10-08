document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCuestionario');
    const resultadoDiv = document.getElementById('resultadoCuestionario');
    const etiquetaRiesgo = document.getElementById('etiquetaRiesgo');
    const mensajeRiesgo = document.getElementById('mensajeRiesgo');
    const btnCalcular = document.querySelector('.btn-calcular');

    // Botón de salir (Redirige a inicio)
    document.querySelector('.btn-salir').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Captura de nuevas variables PSQI y Salud Mental
        const horas = parseFloat(document.getElementById('horas_sueno').value);
        const latencia = parseInt(document.getElementById('latencia_sueno').value);
        const disfuncion = parseInt(document.getElementById('disfuncion_diurna').value);
        const jetlag = parseFloat(document.getElementById('jetlag_social_horas').value);
        const estres = parseInt(document.getElementById('nivel_estres').value);
        const ueas = parseInt(document.getElementById('ueas_inscritas').value);

        // Algoritmo de Riesgo Integral (PSQI adaptado)
        let puntosRiesgo = 0;

        // Horas (Menos de 6 es problemático)
        if (horas < 5) puntosRiesgo += 3;
        else if (horas < 6) puntosRiesgo += 2;

        // Latencia y Disfunción (Suman directo el valor 0-3 del select)
        puntosRiesgo += latencia;
        puntosRiesgo += disfuncion;

        // Jetlag Social
        if (jetlag >= 2) puntosRiesgo += 2;

        // Multiplicador por Salud Mental y Carga Académica
        if (estres >= 4) puntosRiesgo += 3; // Estrés alto suma mucho riesgo
        if (ueas >= 5 && horas < 6) puntosRiesgo += 2; // Burnout por sobrecarga

        // 3. Determinación de Nivel y Textos (Enfoque UX y Cuidado Emocional)
        let nivel = "";
        let claseColor = "";
        let mensaje = "";

        if (puntosRiesgo >= 10) {
            nivel = "Atención Prioritaria";
            claseColor = "riesgo-critico"; 
            mensaje = "Tus respuestas sugieren una acumulación de fatiga y estrés importante. Como medida de bienestar, podría ser muy útil y favorable para ti acercarte a la coordinación de apoyo estudiantil o servicio médico de la universidad para platicar sobre tus rutinas.";
        } else if (puntosRiesgo >= 6) {
            nivel = "Requiere Atención";
            claseColor = "riesgo-alto";
            mensaje = "Tus hábitos actuales indican cierta irregularidad en tu descanso que podría influir en tu energía diurna. Intentar ajustar tus horarios de estudio y sueño podría marcar una diferencia muy positiva en este trimestre.";
        } else if (puntosRiesgo >= 3) {
            nivel = "Favorable";
            claseColor = "riesgo-medio";
            mensaje = "Tus rutinas son estables en general. Existen pequeños detalles (como el uso de pantallas o la diferencia de horarios en fin de semana) que, si los ajustas, te ayudarán a optimizar aún más tu rendimiento.";
        } else {
            nivel = "Óptimo";
            claseColor = "riesgo-bajo";
            mensaje = "¡Vas por muy buen camino! Tus respuestas reflejan un equilibrio adecuado entre tus actividades académicas y tus rutinas de descanso. Mantener este ritmo te ayudará bastante.";
        }

        // 4. Mostrar el resultado en pantalla
        btnCalcular.style.display = 'none';

        etiquetaRiesgo.textContent = nivel;
        etiquetaRiesgo.className = claseColor;
        mensajeRiesgo.textContent = mensaje;
        resultadoDiv.classList.remove('oculta');

        // 5. MAGIA FRONTEND: Guardar los resultados en la memoria del navegador
        localStorage.setItem("testCompletado", "true");
        localStorage.setItem("ultimoTest_horas", horas);
        localStorage.setItem("ultimoTest_jetlag", jetlag);
        localStorage.setItem("ultimoTest_riesgo", nivel);
        localStorage.setItem("ultimoTest_claseColor", claseColor);

        // Convertir el valor numérico del estrés a texto para el panel (Los índices coinciden con el value del select)
        const nivelesEstres = ["", "Muy bajo", "Bajo", "Moderado", "Alto", "Severo"];
        localStorage.setItem("ultimoTest_estres", nivelesEstres[estres]);
    });

    // Lógica universal para Cerrar Sesión
    const btnSalir = document.getElementById("btnCerrarSesionGlobal");
    if (btnSalir) {
        btnSalir.addEventListener("click", (e) => {
            e.preventDefault();
            // 1. Borramos la memoria temporal
            localStorage.removeItem("sesionActiva");
            localStorage.removeItem("nombreAlumno");
            // Limpiamos también los datos del test al salir por privacidad
            localStorage.removeItem("testCompletado");
            localStorage.removeItem("ultimoTest_horas");
            localStorage.removeItem("ultimoTest_jetlag");
            localStorage.removeItem("ultimoTest_riesgo");
            localStorage.removeItem("ultimoTest_claseColor");
            localStorage.removeItem("ultimoTest_estres");

            // 2. Lo mandamos a la portada
            window.location.href = "index.html";
        });
    }
});