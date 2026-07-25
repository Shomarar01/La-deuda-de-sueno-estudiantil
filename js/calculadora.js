document.addEventListener("DOMContentLoaded", function() {

    document.querySelectorAll('.input-caja').forEach(caja => {
        caja.addEventListener('click', function() {
            // esto despliega el reloj del navegador al dar clic en cualquier parte de la caja
            this.querySelector('input[type="time"]').showPicker();
        });
    });

    // ---ESTADO DE LOS BOTONES ---
    let usaPantallas = false;
    let usaCafe = false;

    const btnPantallas = document.getElementById("btn-pantallas");
    const btnCafe = document.getElementById("btn-cafe");

    btnPantallas.addEventListener("click", function() {
        usaPantallas = !usaPantallas;
        this.classList.toggle("activo");
        actualizarCalculadora();
    });

    btnCafe.addEventListener("click", function() {
        usaCafe = !usaCafe;
        this.classList.toggle("activo");
        actualizarCalculadora();
    });

    // --- INPUTS Y OUTPUTS ---
    const inDormir = document.getElementById("calc-dormir");
    const inDespertar = document.getElementById("calc-despertar");
    const inDormirFin = document.getElementById("calc-dormir-fin");

    const outHoras = document.getElementById("out-horas");
    const outJetlag = document.getElementById("out-jetlag");
    const outCalidad = document.getElementById("out-calidad");
    const outRendimiento = document.getElementById("out-rendimiento");
    const outMensaje = document.getElementById("out-mensaje");

    // --- MOTOR PREDICTIVO ---
    function timeToDecimal(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + (minutes / 60);
    }

    function actualizarCalculadora() {
        const hDormir = timeToDecimal(inDormir.value);
        const hDespertar = timeToDecimal(inDespertar.value);
        const hDormirFin = timeToDecimal(inDormirFin.value);

        let duracion = hDespertar - hDormir;
        if (duracion < 0) duracion += 24; 
        
        const hrs = Math.floor(duracion);
        const mins = Math.round((duracion - hrs) * 60);
        const deudaSueno = duracion < 7;

        let desfase = Math.abs(hDormirFin - hDormir);
        if (desfase > 12) desfase = 24 - desfase;
        const jetlagGrave = desfase >= 2;

        let calidad = "Saludable";
        let rendimiento = "Alto Rendimiento";
        let mensaje = "Estás dentro de la minoría de estudiantes con hábitos protectores, tu reloj biológico está alineado para el éxito.";
        let colorEstado = "var(--color-lavanda)";

        // Penalizaciones por hábitos de riesgo
        if (usaPantallas && usaCafe) {
            calidad = "Crítica";
            rendimiento = "Fracaso Escolar";
            mensaje = "Combinar pantallas y cafeína bloquea tu melatonina y genera micro-despertares (Mendeley Data); tu retención de memoria es casi nula.";
            colorEstado = "var(--color-coral)"; 
        } else if (usaPantallas || usaCafe) {
            calidad = "Deficiente";
            rendimiento = "Bajo Promedio";
            mensaje = "El desvelo inducido por estimulantes o luz azul superficializa tu descanso, es un ancla para tu rendimiento.";
            colorEstado = "var(--color-ambar)";
        } else if (jetlagGrave) {
            calidad = "Regular";
            rendimiento = "Bajo Promedio";
            mensaje = `Tienes un <span class="glosario-jetlag" data-tooltip="Diferencia de horas de sueño entre la semana y el sábado.">Jetlag social</span> de ${desfase.toFixed(1)} horas, estás destrozando tu ciclo circadiano el fin de semana, lo que hunde tu promedio.`;
            colorEstado = "var(--color-ambar)";
        } else if (deudaSueno) {
            calidad = "Regular";
            rendimiento = "En Riesgo";
            mensaje = "Tu duración de sueño es insuficiente (< 7h), entrarás en modo supervivencia (siestas diurnas) y tu cognición bajará.";
            colorEstado = "var(--color-ambar)";
        }

        // --- ACTUALIZAR INTERFAZ ---
        outHoras.innerText = `${hrs}h ${mins}m`;
        outHoras.style.color = deudaSueno ? "var(--color-ambar)" : "var(--color-lavanda)";

        outJetlag.innerText = `${desfase.toFixed(1)}h`;
        outJetlag.style.color = jetlagGrave ? "var(--color-ambar)" : "var(--texto-principal)";

        outCalidad.innerText = calidad;
        outCalidad.style.color = colorEstado;

        outRendimiento.innerText = rendimiento;
        outRendimiento.style.color = colorEstado;

        outMensaje.innerHTML = mensaje;
    }

    [inDormir, inDespertar, inDormirFin].forEach(input => {
        input.addEventListener("input", actualizarCalculadora);
    });

    actualizarCalculadora();
});