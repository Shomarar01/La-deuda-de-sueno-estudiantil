// Variables globales
let datosKaggle, datosCMU, datosMendeley;
let svgPrincipal, grupoPrincipal;
let ancho, alto;
const margen = { arriba: 60, derecha: 40, abajo: 80, izquierda: 80 };

const scroller = scrollama();

Promise.all([
    d3.csv("datasetsProyecto/kaggle.csv"),
    d3.csv("datasetsProyecto/cmu.csv"),
    d3.csv("datasetsProyecto/mendeley.csv")
]).then(function(archivos) {
    // 1. Parseo y asignación de ID Global (El truco UX para animaciones fluidas)
    datosKaggle = archivos[0]
        .filter(d => d.Sleep_Duration && d.University_Year)
        .map((d, i) => ({
            ...d,
            Sleep_Duration: +d.Sleep_Duration,
            global_id: i // Le damos una placa de identidad a cada punto
        }));

    // Parseo de CMU (Para la ilusión de constancia)
    datosCMU = archivos[1]
        .filter(d => d.TotalSleepTime_Horas && d.gpa_promedio)
        .map((d, i) => ({
            ...d,
            TotalSleepTime_Horas: +d.TotalSleepTime_Horas,
            gpa_promedio: +d.gpa_promedio,
            variabilidad_horario: +d.variabilidad_horario,
            siestas_min: +d.siestas_min,
            Carga_academica: d.Carga_academica,
            global_id: i // ¡El secreto! Le damos el mismo ID que a los de Kaggle
        }));

    datosMendeley = archivos[2].map((d, i) => ({
        ...d,
        global_id: i
    }));

    console.log("¡Datos listos y limpios!");

    // Inicializamos el lienzo UNA SOLA VEZ
    inicializarLienzo();
    iniciarScrollama();

}).catch(function(error) {
    console.error("Error cargando los CSV:", error);
});


function inicializarLienzo() {
    const contenedor = d3.select("#lienzo-d3").node();
    const rect = contenedor.getBoundingClientRect();

    ancho = Math.max(500, rect.width) - margen.izquierda - margen.derecha;
    alto = Math.max(400, rect.height) - margen.arriba - margen.abajo;

    svgPrincipal = d3.select("#lienzo-d3")
        .append("svg")
        .attr("width", ancho + margen.izquierda + margen.derecha)
        .attr("height", alto + margen.arriba + margen.abajo);

    // Este es el grupo maestro donde vivirá todo
    grupoPrincipal = svgPrincipal.append("g")
        .attr("transform", `translate(${margen.izquierda},${margen.arriba})`);
}

function iniciarScrollama() {
    scroller
        .setup({
            step: "#scrolly article .step",
            offset: 0.5,
            debug: false 
        })
        .onStepEnter(manejarEntradaEscena);

    window.addEventListener("resize", scroller.resize);
}

function manejarEntradaEscena(respuesta) {
    d3.selectAll(".step").classed("is-active", false);
    d3.select(respuesta.element).classed("is-active", true);

    grupoPrincipal.selectAll(".ejes-reloj, .enlace-jetlag, .punto-destino")
    .transition().duration(500).attr("opacity", 0).remove();
    const pasoActual = respuesta.element.getAttribute("data-step");

    // Lógica del Scrollytelling
    if (pasoActual === "0") {
        grupoPrincipal.selectAll(".estudiante")
            .transition().duration(800)
            .attr("r", 0).attr("cx", ancho / 2).attr("cy", alto / 2).remove();
        grupoPrincipal.selectAll(".ejes, .ejes-reloj, .enlace-jetlag").transition().duration(500).attr("opacity", 0).remove();

    } else if (pasoActual === "1") {
        // Borramos las partes exclusivas del reloj por si el usuario hizo scroll hacia arriba
        grupoPrincipal.selectAll(".ejes-reloj, .enlace-jetlag").transition().duration(500).attr("opacity", 0).remove();

        graficaEnjambre.dibujar(grupoPrincipal, datosKaggle, ancho, alto);

    } else if (pasoActual === "2") {
        // ¡Llamamos al Módulo del Reloj!
        graficaReloj.dibujar(grupoPrincipal, datosKaggle, ancho, alto);
    }else if (pasoActual === "3") {
        graficaBurbujas.dibujar(grupoPrincipal, datosCMU, ancho, alto);
    } else if (pasoActual === "4") {
        // Matamos los cuadrantes al instante si venimos de regreso (Adiós bug de pestañas)
        grupoPrincipal.selectAll(".ejes-cuadrantes").interrupt().remove();
        
        graficaMontanas.dibujar(grupoPrincipal, datosCMU, ancho, alto);

    } else if (pasoActual === "5") {
        // Matamos las montañas al instante
        grupoPrincipal.selectAll(".ejes").interrupt().remove();
        
        graficaEfectoDomino.dibujar(grupoPrincipal, datosMendeley, ancho, alto);
    }

}