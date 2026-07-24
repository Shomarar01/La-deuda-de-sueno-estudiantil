const graficaMontanas = (function() {
    let simulacion;

    // =====================================================
    // 1. TOOLTIP GLOBAL
    // =====================================================
    function crearTooltip() {
        let tooltip = d3.select("body").select(".tooltip-global");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "tooltip-global")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background", "rgba(18, 20, 36, 0.96)")
                .style("color", "#FFFFFF")
                .style("border", "1px solid rgba(255, 255, 255, 0.2)")
                .style("border-radius", "8px")
                .style("padding", "10px 14px")
                .style("font-family", "system-ui, -apple-system, sans-serif")
                .style("font-size", "12px")
                .style("box-shadow", "0 8px 24px rgba(0,0,0,0.7)")
                .style("opacity", 0)
                .style("visibility", "hidden")
                .style("z-index", 2000);
        }
        return tooltip;
    }

    // =====================================================
    // 2. DIBUJAR
    // =====================================================
    function dibujar(contenedor, datos, ancho, alto) {
        
        // --- 1. FILTRADO Y ESCALAS ---
        const datosLimpios = (datos || []).filter(d => 
            d.siestas_min !== undefined && 
            !isNaN(d.siestas_min) && 
            d.Carga_academica
        );

        const maxSiesta = d3.min([d3.max(datosLimpios, d => d.siestas_min) || 120, 180]); 
        const escalaX = d3.scaleLinear().domain([0, maxSiesta]).range([0, ancho]);
        
        const categoriasCarga = ["Baja", "Normal", "Alta"];
        const escalaY = d3.scalePoint().domain(categoriasCarga).range([alto, 0]).padding(0.5);
        
        // Paleta consistente: Ámbar (< 7h) y Azul Lavanda (>= 7h)
        const escalaColor = d3.scaleThreshold()
            .domain([7])
            .range(["#FBBF24", "#818CF8"]);

        // --- 2. TRANSICIONES DE EJES Y LEYENDA ---
        contenedor.selectAll(".ejes").remove();
        const grupoEjes = contenedor.append("g").attr("class", "ejes").attr("opacity", 0);

        // Eje X
        const ejeX = d3.axisBottom(escalaX).ticks(8).tickFormat(d => d + "m");
        grupoEjes.append("g")
            .attr("transform", `translate(0,${alto})`)
            .call(ejeX)
            .attr("color", "#94A3B8")
            .style("font-size", "12px")
            .style("font-family", "system-ui, sans-serif");
        
        grupoEjes.append("text")
            .attr("x", ancho / 2)
            .attr("y", alto + 45)
            .attr("fill", "#94A3B8")
            .style("font-family", "system-ui, sans-serif")
            .style("font-size", "13px")
            .style("text-anchor", "middle")
            .text("Duración de las siestas diurnas (minutos)");

        // Eje Y
        const ejeY = d3.axisLeft(escalaY);
        grupoEjes.append("g")
            .call(ejeY)
            .attr("color", "#94A3B8")
            .style("font-size", "12px")
            .style("font-family", "system-ui, sans-serif");

        grupoEjes.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -(alto / 2))
            .attr("fill", "#94A3B8")
            .style("font-family", "system-ui, sans-serif")
            .style("font-size", "13px")
            .style("text-anchor", "middle")
            .text("Carga Académica");

        // Líneas base horizontales sutiles
        grupoEjes.selectAll(".linea-base")
            .data(categoriasCarga)
            .enter()
            .append("line")
            .attr("class", "linea-base")
            .attr("x1", 0)
            .attr("x2", ancho)
            .attr("y1", d => escalaY(d))
            .attr("y2", d => escalaY(d))
            .attr("stroke", "rgba(255, 255, 255, 0.12)")
            .attr("stroke-dasharray", "4 4");

        // LEYENDA SUPERIOR DE SUEÑO NOCTURNO
        const gLeyenda = grupoEjes.append("g")
            .attr("class", "leyenda-sueno")
            .attr("transform", `translate(${ancho - 290}, -20)`);

        // Indicador Ámbar (< 7h)
        gLeyenda.append("circle")
            .attr("cx", 0).attr("cy", 0).attr("r", 5)
            .attr("fill", "#FBBF24");
            
        gLeyenda.append("text")
            .attr("x", 10).attr("y", 4)
            .attr("fill", "#94A3B8")
            .style("font-size", "11px")
            .style("font-family", "system-ui, sans-serif")
            .text("< 7h sueño nocturno");

        // Indicador Azul Lavanda (>= 7h)
        gLeyenda.append("circle")
            .attr("cx", 145).attr("cy", 0).attr("r", 5)
            .attr("fill", "#818CF8");
            
        gLeyenda.append("text")
            .attr("x", 155).attr("y", 4)
            .attr("fill", "#94A3B8")
            .style("font-size", "11px")
            .style("font-family", "system-ui, sans-serif")
            .text("≥ 7h sueño nocturno");

        grupoEjes.transition().duration(600).attr("opacity", 1);

        // --- 3. SIMULACIÓN DE POSICIONES (MONTAÑAS / BEESWARM) ---
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

        // --- 4. RENDERIZADO Y TRANSICIONES ---
        const tooltip = crearTooltip();
        const circulos = contenedor.selectAll(".estudiante").data(datosLimpios, d => d.id);

        const todosLosPuntos = circulos.join(
            enter => enter.append("circle")
                .attr("class", "estudiante")
                .attr("cx", ancho / 2)
                .attr("cy", alto / 2)
                .attr("r", 0)
                .attr("fill", d => escalaColor(d.TotalSleepTime_Horas))
                .attr("opacity", 0.85)
                .call(enter => enter.transition().duration(900).ease(d3.easeCubicOut)
                    .attr("cx", d => d.destinoX)
                    .attr("cy", d => d.destinoY)
                    .attr("r", d => d.radius)
                ),
            
            update => update
                .call(update => update.transition()
                    .duration(900)
                    .ease(d3.easeCubicInOut)
                    .delay((d, i) => i * 0.4)
                    .attr("cx", d => d.destinoX)
                    .attr("cy", d => d.destinoY)
                    .attr("r", d => d.radius)
                    .attr("fill", d => escalaColor(d.TotalSleepTime_Horas))
                    .attr("stroke", "none")
                    .attr("opacity", 0.85)
                ),
            
            exit => exit.transition().duration(400).attr("r", 0).remove()
        );

        // --- 5. INTERACTIVIDAD ROBUSTA ---
        todosLosPuntos
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).raise();

                contenedor.selectAll(".estudiante")
                    .transition("foco")
                    .duration(150)
                    .attr("opacity", 0.15);

                d3.select(this)
                    .transition("foco")
                    .duration(150)
                    .attr("opacity", 1)
                    .attr("stroke", "#FFFFFF")
                    .attr("stroke-width", 2);

                const estadoSueno = d.TotalSleepTime_Horas < 7 ? "Déficit de sueño" : "Sueño suficiente";
                const colorTexto = d.TotalSleepTime_Horas < 7 ? "#FBBF24" : "#818CF8";

                tooltip
                    .style("visibility", "visible")
                    .style("opacity", 1)
                    .html(`
                        <strong style="color: #818CF8; font-size: 13px;">Estudiante #${d.id}</strong>
                        <hr style="margin:6px 0; border:0; border-top:1px solid rgba(255,255,255,0.15);">
                        Carga Académica: <b>${d.Carga_academica}</b><br>
                        Siesta: <b>${d.siestas_min} min</b><br>
                        Sueño nocturno: <b>${(+d.TotalSleepTime_Horas).toFixed(1)} h</b> 
                        <span style="color: ${colorTexto}; font-weight: 600;">(${estadoSueno})</span>
                    `);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 16) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                contenedor.selectAll(".estudiante")
                    .transition("foco")
                    .duration(150)
                    .attr("opacity", 0.85)
                    .attr("stroke", "none");

                tooltip
                    .style("visibility", "hidden")
                    .style("opacity", 0);
            });
            
        contenedor.selectAll(".estudiante").raise();
    }

    return { dibujar };
})();