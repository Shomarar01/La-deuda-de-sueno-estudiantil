document.addEventListener("DOMContentLoaded", function() {
    // Referencias a los inputs
    const inDormir = document.getElementById("calc-dormir");
    const inDespertar = document.getElementById("calc-despertar");
    const inDormirFin = document.getElementById("calc-dormir-fin");
    const inHabitos = document.getElementById("calc-habitos");

    // Referencias a los outputs
    const outHoras = document.getElementById("out-horas");
    const outCalidad = document.getElementById("out-calidad");
    const outRendimiento = document.getElementById("out-rendimiento");
    const outMensaje = document.getElementById("out-mensaje");

    // Función auxiliar para convertir "HH:MM" a horas decimales
    function timeToDecimal(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + (minutes / 60);
    }

    function actualizarCalculadora() {
        const hDormir = timeToDecimal(inDormir.value);
        const hDespertar = timeToDecimal(inDespertar.value);
        const hDormirFin = timeToDecimal(inDormirFin.value);
        const malosHabitos = inHabitos.checked;

        // 1. Calcular Duración (Regla Kaggle/CMU)
        let duracion = hDespertar - hDormir;
        if (duracion < 0) duracion += 24;
        
        const hrs = Math.floor(duracion);
        const mins = Math.round((duracion - hrs) * 60);
        outHoras.innerText = `${hrs}h ${mins}m`;

        const deudaSueno = duracion < 7;

        // 2. Calcular Jetlag Social (Desfase entre semana y fin de semana)
        let desfase = Math.abs(hDormirFin - hDormir);
        if (desfase > 12) desfase = 24 - desfase;
        
        const caosCircadiano = desfase >= 2; // Jetlag severo

        // 3. Evaluar Calidad y Rendimiento
        let calidad = "Buena";
        let rendimiento = "Alto / Excelente";
        let mensaje = "Estás dentro del 7% de estudiantes con hábitos protectores. Tu reloj biológico está alineado para el éxito académico.";
        let claseColor = "texto-verde";

        if (malosHabitos) {
            calidad = "Deficiente";
            rendimiento = "Bajo / En Riesgo";
            mensaje = "El uso nocturno de pantallas/café bloquea tu melatonina (Mendeley Data). Tu sueño es superficial y perjudica tu memoria a corto plazo.";
            claseColor = "texto-rojo";
        } else if (caosCircadiano) {
            calidad = "Regular";
            rendimiento = "Promedio / Bajo";
            mensaje = `Tienes un Jetlag Social de ${desfase.toFixed(1)} horas. Estás destrozando tu ciclo circadiano el fin de semana, lo que hunde tu promedio académico (Kaggle/CMU Data).`;
            claseColor = "texto-rojo";
        } else if (deudaSueno) {
            calidad = "Regular";
            rendimiento = "Promedio / En Riesgo";
            mensaje = "Tu duración de sueño es insuficiente (< 7h). El Modo Supervivencia (siestas diurnas) no bastará para mantener calificaciones de excelencia.";
            claseColor = "texto-rojo";
        }

        // Actualizar UI
        outCalidad.innerText = calidad;
        outRendimiento.innerText = rendimiento;
        outMensaje.innerText = mensaje;

        // Aplicar estilos de color
        outCalidad.className = claseColor;
        outRendimiento.className = claseColor;
        outHoras.className = deudaSueno ? "texto-rojo" : "texto-verde";
    }

    // Escuchar eventos de cambio en tiempo real
    [inDormir, inDespertar, inDormirFin, inHabitos].forEach(input => {
        input.addEventListener("input", actualizarCalculadora);
    });

    // Inicializar con los valores por defecto
    actualizarCalculadora();
});