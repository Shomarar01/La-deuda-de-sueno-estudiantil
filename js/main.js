// --- VARIABLES GLOBALES ---
let datosKaggle, datosCMU, datosMendeley, datosMundiales, geojsonMundo;
let svgPrincipal, grupoPrincipal;
let ancho, alto;
const margen = { arriba: 60, derecha: 40, abajo: 80, izquierda: 80 };

const scroller = scrollama();

Promise.all([
    d3.csv("datasetsProyecto/kaggle.csv"),
    d3.csv("datasetsProyecto/cmu.csv"),
    d3.csv("datasetsProyecto/mendeley.csv"),
    d3.csv("datasetsProyecto/mmundial.csv"),
    d3.json("datasetsProyecto/countries.geojson")
]).then(function(archivos) {

    // KAGGLE 
    datosKaggle = archivos[0]
        .filter(d => d.Sleep_Duration && d.University_Year)
        .map(d => ({
            ...d,
            id: String(d.Student_ID),
            Sleep_Duration: +d.Sleep_Duration,
            Weekday_Sleep_Start: +d.Weekday_Sleep_Start,
            Weekend_Sleep_Start: +d.Weekend_Sleep_Start
        }));

    //CMU
    datosCMU = archivos[1]
        .filter(d => d.TotalSleepTime_Horas && d.gpa_promedio)
        .map((d, i) => ({
            ...d,
            id: String(i),
            TotalSleepTime_Horas: +d.TotalSleepTime_Horas,
            gpa_promedio: +d.gpa_promedio,
            variabilidad_horario: +d.variabilidad_horario,
            siestas_min: +d.siestas_min,
            Carga_academica: d.Carga_academica
        }));

    // MENDELEY 
    datosMendeley = archivos[2].map((d, i) => ({
        ...d,
        id: String(i)
    }));

    //  MUNDIAL
    datosMundiales = archivos[3].map(d => ({
        country: d.country,
        hours: +d.Hours
    }));
    geojsonMundo = archivos[4];

    console.log("Datasets cargados y listos.");

    inicializarLienzo();
    iniciarScrollama();

}).catch(function(error) {
    console.error("Error crítico cargando los archivos:", error);
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

    const pasoActual = respuesta.element.getAttribute("data-step");

    d3.selectAll(".reloj-tooltip, .tooltip-global, .tooltip-mapa")
        .style("visibility", "hidden")
        .style("opacity", 0);

    grupoPrincipal.selectAll("*").interrupt().remove();


    if (pasoActual === "0") {
        graficaMapa.dibujar(grupoPrincipal, geojsonMundo, datosMundiales, ancho, alto);
    } else if (pasoActual === "1") {
        graficaEnjambre.dibujar(grupoPrincipal, datosKaggle, ancho, alto);
    } else if (pasoActual === "2") {
        graficaReloj.dibujar(grupoPrincipal, datosKaggle, ancho, alto);
    } else if (pasoActual === "3") {
        graficaBurbujas.dibujar(grupoPrincipal, datosCMU, ancho, alto);
    } else if (pasoActual === "4") {
        graficaMontanas.dibujar(grupoPrincipal, datosCMU, ancho, alto);
    } else if (pasoActual === "5") {
        graficaEfectoDomino.dibujar(grupoPrincipal, datosMendeley, ancho, alto);
    }
}
