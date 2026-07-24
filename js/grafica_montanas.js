const graficaMontanas = (function() {
    let simulacion;

    // --- TOOLTIP GLOBAL SEGURO ---
    function crearTooltip() {
        let tooltip = d3.select("body").select(".tooltip-global");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "tooltip-global")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background", "#ffffff")
                .style("color", "#1E1B4B")
                .style("border", "1px solid #cccccc")
                .style("border-radius", "8px")
                .style("padding", "10px")
                .style("font-family", "Inter, sans-serif")
                .style("font-size", "13px")
                .style("box-shadow", "0 4px 10px rgba(0,0,0,.1)")
                .style("opacity", 0)
                .style("visibility", "hidden")
                .style("z-index", 2000);
        }
        return tooltip;
    }

    function dibujar(contenedor, datos, ancho, alto) {
        // --- 1. ESCALAS ---
        const datosLimpios = datos.filter(d => d.siestas_min !== undefined && d.Carga_academica);

        const maxSiesta = d3.min([d3.max(datosLimpios, d => d.siestas_min), 180]); 
        const escalaX = d3.scaleLinear().domain([0, maxSiesta]).range([0, ancho]);
        
        const categoriasCarga = ["Baja", "Normal", "Alta"];
        const escalaY = d3.scalePoint().domain(categoriasCarga).range([alto, 0]).padding(0.5);
        
        const escalaColor = d3.scaleThreshold().domain([7]).range(["#FB7185", "#34D399"]);

        // --- 2. TRANSICIONES DE EJES Y LEYENDA ---
        contenedor.selectAll(".ejes").remove();
        const grupoEjes = contenedor.append("g").attr("class", "ejes").attr("opacity", 0);

        const ejeX = d3.axisBottom(escalaX).ticks(8).tickFormat(d => d);
        grupoEjes.append("g").attr("transform", `translate(0,${alto})`).call(ejeX)
            .attr("color", "#94A3B8").style("font-size", "14px").style("font-family", "Inter");
        
        grupoEjes.append("text").attr("x", ancho / 2).attr("y", alto + 50)
            .attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px")
            .style("text-anchor", "middle").text("Duración de las siestas diurnas (minutos)");

        const ejeY = d3.axisLeft(escalaY);
        grupoEjes.append("g").call(ejeY)
            .attr("color", "#F1F5F9").style("font-size", "14px").style("font-family", "Inter");

        grupoEjes.append("text").attr("transform", "rotate(-90)")
            .attr("y", -60).attr("x", -(alto / 2))
            .attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px")
            .style("text-anchor", "middle").text("Carga Académica");

        grupoEjes.selectAll(".linea-base")
            .data(categoriasCarga).enter().append("line")
            .attr("x1", 0).attr("x2", ancho).attr("y1", d => escalaY(d) + 5).attr("y2", d => escalaY(d) + 5)
            .attr("stroke", "rgba(99, 102, 241, 0.2)");

        // --- LEYENDA EXPLICATIVA DE COLORES (NUEVO) ---
        const gLeyenda = grupoEjes.append("g")
            .attr("class", "leyenda-sueno")
            .attr("transform", `translate(${ancho - 280}, -25)`);

        // Indicador Rojo (< 7h)
        gLeyenda.append("circle")
            .attr("cx", 0).attr("cy", 0).attr("r", 5)
            .attr("fill", "#FB7185");
        gLeyenda.append("text")
            .attr("x", 10).attr("y", 4)
            .attr("fill", "#94A3B8").style("font-size", "12px").style("font-family", "Inter")
            .text("< 7h sueño nocturno");

        // Indicador Verde (>= 7h)
        gLeyenda.append("circle")
            .attr("cx", 140).attr("cy", 0).attr("r", 5)
            .attr("fill", "#34D399");
        gLeyenda.append("text")
            .attr("x", 150).attr("y", 4)
            .attr("fill", "#94A3B8").style("font-size", "12px").style("font-family", "Inter")
            .text("≥ 7h sueño nocturno");

        grupoEjes.transition().duration(800).attr("opacity", 1);

        // --- 3. CÁLCULO DE POSICIONES FINALES (MONTAÑAS) ---
        const nodosSimulacion = datosLimpios.map(d => Object.assign({}, d));

        if (simulacion) simulacion.stop();
        
        simulacion = d3.forceSimulation(nodosSimulacion)
            .force("x", d3.forceX(d => escalaX(d.siestas_min)).strength(1))
            .force("y", d3.forceY(d => escalaY(d.Carga_academica)).strength(1))
            .force("colision", d3.forceCollide().radius(5).iterations(2))
            .stop();

        for (let i = 0; i < 120; i++) simulacion.tick();

        datosLimpios.forEach((d, i) => {
            d.destinoX = nodosSimulacion[i].x;
            d.destinoY = nodosSimulacion[i].y;
            d.radius = 4.5;
        });

        // --- 4. MOTOR DE VUELO FLUIDO ---
        const tooltip = crearTooltip();
        const circulos = contenedor.selectAll(".estudiante").data(datosLimpios, d => d.id);

        const todosLosPuntos = circulos.join(
            enter => enter.append("circle")
                .attr("class", "estudiante")
                .attr("cx", ancho / 2).attr("cy", alto / 2).attr("r", 0)
                .attr("fill", d => escalaColor(d.TotalSleepTime_Horas))
                .attr("opacity", 0.9)
                .call(enter => enter.transition().duration(1000).ease(d3.easeCubicOut)
                    .attr("cx", d => d.destinoX)
                    .attr("cy", d => d.destinoY)
                    .attr("r", d => d.radius)
                ),
            
            update => update
                .call(update => update.transition()
                    .duration(1000)
                    .ease(d3.easeCubicInOut)
                    .delay((d, i) => i * 0.5)
                    .attr("cx", d => d.destinoX)
                    .attr("cy", d => d.destinoY)
                    .attr("r", d => d.radius)
                    .attr("fill", d => escalaColor(d.TotalSleepTime_Horas))
                    .attr("stroke", "none")
                    .attr("opacity", 0.9)
                ),
            
            exit => exit.transition().duration(500).attr("r", 0).remove()
        );

        // --- INTERACTIVIDAD ROBUSTA (NUEVO) ---
        todosLosPuntos
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).raise();

                contenedor.selectAll(".estudiante").transition("foco").duration(150).attr("opacity", 0.2);

                d3.select(this).transition("foco").duration(150)
                    .attr("opacity", 1)
                    .attr("stroke", "#FFFFFF")
                    .attr("stroke-width", 2);

                const estadoSueno = d.TotalSleepTime_Horas < 7 ? "Déficit de sueño" : "Sueño suficiente";

                tooltip
                    .style("visibility", "visible")
                    .style("opacity", 1)
                    .html(`
                        <strong>Estudiante #${d.id}</strong><hr style="margin:4px 0; border:0; border-top:1px solid #e2e8f0;">
                        Carga Académica: <b>${d.Carga_academica}</b><br>
                        Siesta: <b>${d.siestas_min} min</b><br>
                        Sueño nocturno: <b>${d.TotalSleepTime_Horas} h</b> (${estadoSueno})
                    `);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 25) + "px");
            })
            .on("mouseout", function() {
                contenedor.selectAll(".estudiante").transition("foco").duration(150)
                    .attr("opacity", 0.9)
                    .attr("stroke", "none");

                tooltip
                    .style("visibility", "hidden")
                    .style("opacity", 0);
            });
            
        contenedor.selectAll(".estudiante").raise();
    }

    return { dibujar };
})();