
// --- VARIABLES GLOBALES ---
// Cada dataset se queda por separado (SIN combinar CSV entre sí).
// La "constancia de objetos" solo aplica entre escenas que comparten
// el MISMO archivo de origen real:
//   - Kaggle    -> Escena 1 (enjambre) y Escena 2 (reloj)
//   - CMU       -> Escena 3 (burbujas) y Escena 4 (montañas)
//   - Mendeley  -> Escena 5 (cuadrantes), sola
//   - Mundial   -> Escena 0 (mapa), sola
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

    // --- 1. KAGGLE (Escenas 1 y 2) ---
    // Student_ID es un identificador real dentro de este archivo:
    // lo usamos como llave de constancia de objetos entre reloj y enjambre.
    datosKaggle = archivos[0]
        .filter(d => d.Sleep_Duration && d.University_Year)
        .map(d => ({
            ...d,
            id: String(d.Student_ID),
            Sleep_Duration: +d.Sleep_Duration,
            Weekday_Sleep_Start: +d.Weekday_Sleep_Start,
            Weekend_Sleep_Start: +d.Weekend_Sleep_Start
        }));

    // --- 2. CMU (Escenas 3 y 4) ---
    // Este archivo no trae un ID de estudiante, así que usamos la posición
    // de la fila DENTRO del propio archivo como identificador (no se mezcla
    // con ningún otro dataset, solo nos sirve para reconocer la fila entre
    // burbujas y montañas).
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

    // --- 3. MENDELEY (Escena 5, no viaja a ninguna otra escena) ---
    datosMendeley = archivos[2].map((d, i) => ({
        ...d,
        id: String(i)
    }));

    // --- 4. MUNDIAL (Escena 0, mapa) ---
    datosMundiales = archivos[3].map(d => ({
        country: d.country,
        hours: +d.Hours
    }));
    geojsonMundo = archivos[4];

    console.log("Datasets cargados por separado:", { datosKaggle, datosCMU, datosMendeley, datosMundiales });

    inicializarLienzo();
    iniciarScrollama();

}).catch(function(error) {
    console.error("Error cargando los archivos:", error);
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
    //Recien añadido
    d3.selectAll(".reloj-tooltip, .tooltip-global, .tooltip-mapa")
    .style("visibility", "hidden")
    .style("opacity", 0);
    d3.selectAll(".step").classed("is-active", false);
    d3.select(respuesta.element).classed("is-active", true);

    const pasoActual = respuesta.element.getAttribute("data-step");

    // 1. Ocultar tooltips residuales
    d3.selectAll(".reloj-tooltip, .tooltip-global, .tooltip-mapa")
        .style("visibility", "hidden")
        .style("opacity", 0);

    // 2. REGLA DE ORO: Cancelar animaciones y LIMPIAR TODO el grupo principal
    grupoPrincipal.selectAll("*").interrupt().remove();

    // 3. Renderizar únicamente la escena correspondiente
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