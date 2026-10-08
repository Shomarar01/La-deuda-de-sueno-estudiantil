document.addEventListener('DOMContentLoaded', () => {
    // 1. Perfil del Usuario
    // Recuperamos el nombre que guardó el registro. Si no hay, le pone "Estudiante" por defecto.
    const nombreGuardado = localStorage.getItem("nombreAlumno") || "Estudiante";

    const datosAlumno = {
        nombre: nombreGuardado, // ¡Ahora es dinámico!
        matricula: "219304111", // (Esto también se hará dinámico cuando usemos la BD real)
        ingreso: "23-O",
        genero: "Femenino",
        horasSueno: 4.5,
        jetlagSocial: 3.5,
        nivelEstres: "Alto",
        riesgo: "Requiere Atención",
        claseColor: "riesgo-alto"
    };

    // 2. Inyección de datos personales en el HTML
    document.getElementById('dashNombre').textContent = datosAlumno.nombre;
    document.getElementById('dashMatricula').textContent = datosAlumno.matricula;
    document.getElementById('dashIngreso').textContent = datosAlumno.ingreso;

    document.getElementById('dashHoras').textContent = datosAlumno.horasSueno + " h";
    document.getElementById('dashJetlag').textContent = datosAlumno.jetlagSocial + " h";
    document.getElementById('dashEstres').textContent = datosAlumno.nivelEstres;

    const tituloRiesgo = document.getElementById('dashNivelRiesgo');
    tituloRiesgo.textContent = datosAlumno.riesgo;
    tituloRiesgo.className = datosAlumno.claseColor;

    // 3. Recomendaciones Dinámicas
    const recuadroRecomendacion = document.getElementById('dashRecomendacion');
    if (datosAlumno.riesgo === "Requiere Atención") {
        recuadroRecomendacion.innerHTML = `Notamos que tus horas de sueño bajaron recientemente.<br><br><strong>Sugerencia:</strong> Si la carga académica te está rebasando, intenta establecer una "hora de desconexión" obligatoria para tus pantallas. Tu cerebro necesita al menos 30 min sin luz azul para inducir el sueño.`;
    }

    // 4. Lógica de la Línea de Tiempo (Manejo de vacíos)
    const contenedorGrafica = document.getElementById('contenedorGrafica');
    
    // Simulamos todos los trimestres transcurridos desde que ingresó (23-O)
    const lineaDeTiempo = [
        { trimestre: "23-O", contesto: false, horas: 0 }, // No contestó
        { trimestre: "24-I", contesto: true, horas: 6.5 },
        { trimestre: "24-P", contesto: false, horas: 0 }, // No contestó
        { trimestre: "24-O", contesto: true, horas: 7.0 },
        { trimestre: "25-I", contesto: true, horas: 6.0 },
        { trimestre: "25-P", contesto: false, horas: 0 }, // No contestó
        { trimestre: "25-O", contesto: true, horas: 7.5 },
        { trimestre: "26-I", contesto: true, horas: 4.5 } // Trimestre actual (Bajó mucho)
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
            window.location.href = "index.html";
        });
    }
});