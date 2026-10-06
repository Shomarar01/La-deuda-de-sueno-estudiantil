document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCuestionario');
    const resultadoDiv = document.getElementById('resultadoCuestionario');
    const etiquetaRiesgo = document.getElementById('etiquetaRiesgo');
    const mensajeRiesgo = document.getElementById('mensajeRiesgo');
    const btnCalcular = document.querySelector('.btn-calcular');

    form.addEventListener('submit', (e) => {
        // Evita que la página se recargue
        e.preventDefault();

        // los valores de los inputs
        const horas = parseFloat(document.getElementById('horas_sueno').value);
        const calidad = parseInt(document.getElementById('calidad_sueno').value);
        const usoPantallas = parseInt(document.querySelector('input[name="uso_pantallas"]:checked').value);
        const consumoCafeina = parseInt(document.querySelector('input[name="consumo_cafeina"]:checked').value);
        const jetlag = parseFloat(document.getElementById('jetlag_social_horas').value);

        // 2. Algoritmo de Riesgo Simulado (Sistema de Puntos estilo PSQI)
        let puntosRiesgo = 0;

        // Evaluación de Horas
        if (horas < 5) puntosRiesgo += 3;
        else if (horas < 7) puntosRiesgo += 1.5;
        // Evaluación de Calidad (1=Pésima suma 3 pts, 5=Excelente suma 0)
        if (calidad <= 2) puntosRiesgo += 2;
        else if (calidad === 3) puntosRiesgo += 1;
        // Hábitos nocivos
        if (usoPantallas === 1) puntosRiesgo += 1;
        if (consumoCafeina === 1) puntosRiesgo += 1;
        // Jetlag Social (Más de 2 horas altera severamente el ritmo circadiano)
        if (jetlag >= 2) puntosRiesgo += 1.5;

        //  Nivel y Textos
        let nivel = "";
        let claseColor = "";
        let mensaje = "";

        if (puntosRiesgo >= 6) {
            nivel = "CRÍTICO";
            claseColor = "riesgo-critico";
            mensaje = "Atención: Tus hábitos de sueño muestran indicadores de riesgo severos. Se recomienda encarecidamente revisar tu higiene del sueño o buscar apoyo en el área de bienestar.";
        } else if (puntosRiesgo >= 4) {
            nivel = "ALTO";
            claseColor = "riesgo-alto";
            mensaje = "Precaución: Tienes una acumulación notable de deuda de sueño. Es probable que experimentes fatiga cognitiva durante el trimestre.";
        } else if (puntosRiesgo >= 2) {
            nivel = "MEDIO";
            claseColor = "riesgo-medio";
            mensaje = "Regular: Tienes algunos hábitos que podrían mejorar para optimizar tu descanso y rendimiento académico.";
        } else {
            nivel = "BAJO";
            claseColor = "riesgo-bajo";
            mensaje = "¡Excelente! Mantienes una higiene de sueño óptima. Tus hábitos protegen tu salud mental y cognitiva.";
        }

        //resultado en pantalla (Simulando respuesta del backend)
        btnCalcular.style.display = 'none'; // Ocultamos el botón de enviar
        
        etiquetaRiesgo.textContent = nivel;
        etiquetaRiesgo.className = claseColor; // Aplicamos el color (verde, amarillo, rojo)
        mensajeRiesgo.textContent = mensaje;
        
        // Efecto visual de despliegue
        resultadoDiv.classList.remove('oculta');
        
        // Nota: En la Fase 2, aquí usaremos fetch() para enviar 'horas', 'calidad', etc., a Node.js
    });
});