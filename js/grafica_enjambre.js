const graficaEnjambre = (function() {
    let simulacion;

    function crearTooltip() {
        let tooltip = d3.select("body").select(".tooltip-global");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div").attr("class", "tooltip-global")
                .style("position", "absolute").style("pointer-events", "none")
                .style("background", "rgba(18, 20, 36, 0.96)")
                .style("color", "#FFFFFF")
                .style("border", "1px solid rgba(255, 255, 255, 0.2)")
                .style("border-radius", "8px")
                .style("padding", "10px 14px")
                .style("font-family", "system-ui, sans-serif")
                .style("font-size", "12px")
                .style("box-shadow", "0 8px 24px rgba(0,0,0,0.7)")
                .style("opacity", 0)
                .style("visibility", "hidden")
                .style("z-index", 2000);
        }
        return tooltip;
    }

    function dibujar(contenedor, datos, ancho, alto) {
        contenedor.selectAll(".estudiante").interrupt();
        const tooltip = crearTooltip();
        tooltip.style("visibility", "hidden").style("opacity", 0);

        const datosLimpios = (datos || []).filter(d => d.Sleep_Duration !== undefined && !isNaN(d.Sleep_Duration) && d.University_Year);

        // --- ESCALAS ---
        const escalaX = d3.scaleLinear().domain([0, 10]).range([0, ancho]);
        const añosLimpios = [...new Set(datosLimpios.map(d => parseInt(d.University_Year.charAt(0))))].sort((a,b) => a-b);
        const escalaY = d3.scalePoint().domain(añosLimpios).range([alto, 0]).padding(0.5);
        
        const escalaColor = d3.scaleThreshold()
            .domain([7])
            .range(["#FBBF24", "#818CF8"]);

        contenedor.selectAll(".ejes").remove();
        const grupoEjes = contenedor.append("g").attr("class", "ejes").attr("opacity", 0);

        // --- EJES ---
        const ejeX = d3.axisBottom(escalaX).ticks(10).tickFormat(d => d);
        grupoEjes.append("g").attr("transform", `translate(0,${alto})`).call(ejeX).attr("color", "#94A3B8").style("font-size", "12px");
        grupoEjes.append("text").attr("x", ancho / 2).attr("y", alto + 45).attr("fill", "#94A3B8").style("font-size", "13px").style("text-anchor", "middle").text("Horas de sueño nocturno");

        const ejeY = d3.axisLeft(escalaY);
        grupoEjes.append("g").call(ejeY).attr("color", "#94A3B8").style("font-size", "12px");
        grupoEjes.append("text").attr("transform", "rotate(-90)").attr("y", -40).attr("x", -(alto / 2)).attr("fill", "#94A3B8").style("font-size", "13px").style("text-anchor", "middle").text("Año universitario");

        // Leyenda
        const leyenda = grupoEjes.append("g").attr("class", "leyenda-enjambre").attr("transform", `translate(${ancho / 2 - 140}, -20)`);
        leyenda.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 5).attr("fill", "#FBBF24");
        leyenda.append("text").attr("x", 12).attr("y", 4).text("Deuda de sueño (< 7h)").attr("fill", "#94A3B8").style("font-size", "11px");
        leyenda.append("circle").attr("cx", 160).attr("cy", 0).attr("r", 5).attr("fill", "#818CF8");
        leyenda.append("text").attr("x", 172).attr("y", 4).text("Sueño saludable (≥ 7h)").attr("fill", "#94A3B8").style("font-size", "11px");

        grupoEjes.transition().duration(800).attr("opacity", 1);

        // --- MOTOR DE DISPERSIÓN (VUELO DESDE EXTREMOS) ---
        const nodos = datosLimpios.map(d => {
            // Generar posición inicial aleatoria en los bordes de la pantalla
            const lado = Math.random() > 0.5 ? -50 : ancho + 50;
            return Object.assign({}, d, {
                radius: 5,
                x: lado, // Empiezan fuera de la pantalla
                y: Math.random() * alto,
                añoNum: parseInt(d.University_Year.charAt(0))
            });
        });

        const circulos = contenedor.selectAll(".estudiante").data(nodos, d => String(d.id));

        const todosLosPuntos = circulos.enter().append("circle")
            .attr("class", "estudiante")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 0)
            .attr("fill", d => escalaColor(d.Sleep_Duration))
            .attr("opacity", 0);

        // --- TRANSICIÓN ---
        if (simulacion) simulacion.stop();
        simulacion = d3.forceSimulation(nodos)
            .force("x", d3.forceX(d => escalaX(d.Sleep_Duration)).strength(0.05))
            .force("y", d3.forceY(d => escalaY(d.añoNum)).strength(0.05))
            .force("colision", d3.forceCollide().radius(6).iterations(2))
            .on("tick", () => {
                todosLosPuntos.attr("cx", d => d.x).attr("cy", d => d.y);
            });

        // transición de entrada
        todosLosPuntos.transition().duration(1200)
            .attr("r", d => d.radius)
            .attr("opacity", 0.85);

        // --- INTERACTIVIDAD ---
        todosLosPuntos.style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).raise();
                contenedor.selectAll(".estudiante").transition("foco").duration(150).attr("opacity", 0.15);
                d3.select(this).transition("foco").duration(150).attr("opacity", 1).attr("stroke", "#FFFFFF").attr("stroke-width", 2);

                const estado = d.Sleep_Duration < 7 ? "Deuda de sueño" : "Sueño saludable";
                const colorTexto = d.Sleep_Duration < 7 ? "#FBBF24" : "#818CF8";
                tooltip.style("visibility", "visible").style("opacity", 1).html(`
                    <strong style="color: #818CF8; font-size: 13px;">Estudiante #${d.id}</strong>
                    <hr style="margin:6px 0; border:0; border-top:1px solid rgba(255,255,255,0.15);">
                    Año: <b>${d.University_Year}</b><br>
                    Horas de sueño: <b>${(+d.Sleep_Duration).toFixed(1)}</b>
                    <span style="color: ${colorTexto}; font-weight: 600;">(${estado})</span>
                `);
            })
            .on("mousemove", event => tooltip.style("left", (event.pageX + 16) + "px").style("top", (event.pageY - 20) + "px"))
            .on("mouseout", function() {
                contenedor.selectAll(".estudiante").transition("foco").duration(150).attr("opacity", 0.85).attr("stroke", "none");
                tooltip.style("visibility", "hidden").style("opacity", 0);
            });
    }
    return { dibujar };
})();