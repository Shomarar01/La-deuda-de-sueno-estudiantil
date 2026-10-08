document.addEventListener('DOMContentLoaded', () => {
    // 1. Perfil del Usuario y Recuperación de Datos
    const nombreGuardado = localStorage.getItem("nombreAlumno") || "Estudiante";
    const testCompletado = localStorage.getItem("testCompletado") === "true";

    // Si hizo el test, leemos sus datos. Si no, mostramos valores en cero o pendientes.
    const datosAlumno = {
        nombre: nombreGuardado,
        matricula: "219304111",
        ingreso: "23-O",
        horasSueno: testCompletado ? parseFloat(localStorage.getItem("ultimoTest_horas")) : 0,
        jetlagSocial: testCompletado ? parseFloat(localStorage.getItem("ultimoTest_jetlag")) : 0,
        nivelEstres: testCompletado ? localStorage.getItem("ultimoTest_estres") : "Sin datos",
        riesgo: testCompletado ? localStorage.getItem("ultimoTest_riesgo") : "Pendiente",
        claseColor: testCompletado ? localStorage.getItem("ultimoTest_claseColor") : "riesgo-medio"
    };

    // 2. Inyección de datos personales en el HTML
    document.getElementById('dashNombre').textContent = datosAlumno.nombre;
    document.getElementById('dashMatricula').textContent = datosAlumno.matricula;
    document.getElementById('dashIngreso').textContent = datosAlumno.ingreso;

    // Si no ha hecho el test, muestra "--", si ya lo hizo, muestra el número
    document.getElementById('dashHoras').textContent = testCompletado ? datosAlumno.horasSueno + " h" : "-- h";
    document.getElementById('dashJetlag').textContent = testCompletado ? datosAlumno.jetlagSocial + " h" : "-- h";
    document.getElementById('dashEstres').textContent = datosAlumno.nivelEstres;

    const tituloRiesgo = document.getElementById('dashNivelRiesgo');
    tituloRiesgo.textContent = datosAlumno.riesgo;
    tituloRiesgo.className = datosAlumno.claseColor;

    // 3. Recomendaciones Dinámicas (¡Para todos los niveles!)
    const recuadroRecomendacion = document.getElementById('dashRecomendacion');

    if (!testCompletado) {
        recuadroRecomendacion.innerHTML = `Aún no tenemos datos suficientes para generar un perfil de descanso este trimestre.<br><br><strong>Sugerencia:</strong> Realiza tu evaluación mensual para desbloquear tus métricas y recibir recomendaciones.`;
    }
    else if (datosAlumno.riesgo.includes("Prioritaria") || datosAlumno.claseColor === "riesgo-critico") {
        recuadroRecomendacion.innerHTML = `Tus métricas recientes muestran un desgaste profundo (Jetlag: <strong>${datosAlumno.jetlagSocial}h</strong>, Estrés: <strong>${datosAlumno.nivelEstres}</strong>).<br><br><strong>Sugerencia Institucional:</strong> Tu bienestar es primero. Te recomendamos encarecidamente priorizar tu descanso esta semana y considerar agendar una sesión breve con la coordinación de bienestar de la UAM para platicar sobre tu carga de UEAs.`;
    }
    else if (datosAlumno.riesgo.includes("Atención") || datosAlumno.claseColor === "riesgo-alto") {
        recuadroRecomendacion.innerHTML = `Notamos que tus horas de sueño bajaron a <strong>${datosAlumno.horasSueno}h</strong> recientemente y tu estrés es <strong>${datosAlumno.nivelEstres}</strong>.<br><br><strong>Sugerencia:</strong> Si la carga académica te está rebasando, intenta establecer una "hora de desconexión" obligatoria para tus pantallas. Tu cerebro necesita al menos 30 min sin luz azul para inducir el sueño.`;
    }
    else if (datosAlumno.riesgo === "Favorable" || datosAlumno.claseColor === "riesgo-medio") {
        recuadroRecomendacion.innerHTML = `Tus rutinas son estables en general, pero tienes un jetlag social de <strong>${datosAlumno.jetlagSocial}h</strong>.<br><br><strong>Sugerencia:</strong> Intenta que la diferencia entre la hora que te levantas el fin de semana y entre semana no sea mayor a 1 hora. Esto mantendrá tu energía constante en las clases matutinas.`;
    }
    else {
        // Nivel Óptimo / Riesgo Bajo
        recuadroRecomendacion.innerHTML = `¡Excelente trabajo! Mantienes un promedio saludable de <strong>${datosAlumno.horasSueno}h</strong> de descanso con niveles de estrés controlados.<br><br><strong>Sugerencia:</strong> Sigue protegiendo tus horarios de descanso como hasta ahora. Tu higiene de sueño es una gran ventaja competitiva para tu rendimiento académico.`;
    }

    // 4. Lógica de la Línea de Tiempo (Manejo de vacíos y datos dinámicos)
    const contenedorGrafica = document.getElementById('contenedorGrafica');

    const lineaDeTiempo = [
        { trimestre: "23-O", contesto: false, horas: 0 },
        { trimestre: "24-I", contesto: true, horas: 6.5 },
        { trimestre: "24-P", contesto: false, horas: 0 },
        { trimestre: "24-O", contesto: true, horas: 7.0 },
        { trimestre: "25-I", contesto: true, horas: 6.0 },
        { trimestre: "25-P", contesto: false, horas: 0 },
        { trimestre: "25-O", contesto: true, horas: 7.5 },
        // Aquí hacemos que el trimestre actual lea lo que contestaste en la encuesta
        {
            trimestre: "26-I",
            contesto: testCompletado,
            horas: testCompletado ? datosAlumno.horasSueno : 0
        }
    ];

    lineaDeTiempo.forEach(dato => {
        const barra = document.createElement('div');
        barra.className = 'barra-grafica';

        if (dato.contesto) {
            // Calcular altura de la barra (Max 10 horas = 100%)
            const alturaPorcentaje = (dato.horas / 10) * 100;
            // Definir color según horas (Menos de 6 es ámbar/rojo)
            const color = dato.horas >= 7 ? 'var(--color-exito)' : (dato.horas >= 6 ? 'var(--color-ambar)' : 'var(--color-alerta)');
            
            barra.innerHTML = `
                <div class="relleno" style="height: ${alturaPorcentaje}%; background-color: ${color};" title="${dato.horas} horas"></div>
                <span>${dato.trimestre}</span>
            `;
        } else {
            // Trimestre vacío sin registro
            barra.innerHTML = `
                <div class="barra-vacia" title="Sin registro"></div>
                <span>${dato.trimestre}</span>
            `;
        }

        contenedorGrafica.appendChild(barra);
    });

    // Lógica universal para Cerrar Sesión
    const btnSalir = document.getElementById("btnCerrarSesionGlobal");
    if (btnSalir) {
        btnSalir.addEventListener("click", (e) => {
            e.preventDefault();
            // 1. Borramos la memoria temporal
            localStorage.removeItem("sesionActiva");
            localStorage.removeItem("nombreAlumno");
            // 2. Lo mandamos a la portada (que ahora mostrará los botones de Login de nuevo)
            window.location.href = "../index.html";
        });
    }
});