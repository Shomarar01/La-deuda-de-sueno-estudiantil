const graficaEnjambre = (function() {
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
        
        // --- RUTINA DE LIMPIEZA INICIAL ---
        contenedor.selectAll(".estudiante")
            .interrupt().interrupt("ocultar")
            .on("mouseover", null)
            .on("mousemove", null)
            .on("mouseout", null)
            .attr("stroke", "none")
            .attr("opacity", 0.85);
            
        const tooltip = crearTooltip();
        tooltip.style("visibility", "hidden").style("opacity", 0);

        // --- ESCUDO ANTI-NaN ---
        const datosLimpios = (datos || []).filter(d => 
            d.Sleep_Duration !== undefined && !isNaN(d.Sleep_Duration) &&
            d.University_Year !== undefined
        );

        // --- 1. ESCALAS ---
        const escalaX = d3.scaleLinear().domain([4, 10]).range([0, ancho]);
        const categoriasAnio = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
        const escalaY = d3.scalePoint().domain(categoriasAnio).range([0, alto]).padding(0.5);
        
        // Gradiente continuo consistente: Ámbar (<7h) a Azul Lavanda (>=7h)
        const escalaColor = d3.scaleLinear()
            .domain([4, 7, 10])
            .range(["#FBBF24", "#FBBF24", "#818CF8"])
            .clamp(true);

        // --- 2. EJES Y LEYENDAS ---
        contenedor.selectAll(".ejes").remove();
        const grupoEjes = contenedor.append("g").attr("class", "ejes").attr("opacity", 0);

        // Eje X
        const ejeX = d3.axisBottom(escalaX).ticks(6).tickFormat(d => d + "h");
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
            .text("Horas de sueño nocturno");

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
            .text("Año Universitario");

        // Leyenda Superior
        const leyenda = grupoEjes.append("g")
            .attr("class", "leyenda-enjambre")
            .attr("transform", `translate(${ancho / 2 - 140}, -20)`);

        leyenda.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 5).attr("fill", "#FBBF24");
        leyenda.append("text").attr("x", 12).attr("y", 4)
            .text("Deuda de sueño (< 7h)")
            .attr("fill", "#94A3B8")
            .style("font-family", "system-ui, sans-serif")
            .style("font-size", "11px");

        leyenda.append("circle").attr("cx", 160).attr("cy", 0).attr("r", 5).attr("fill", "#818CF8");
        leyenda.append("text").attr("x", 172).attr("y", 4)
            .text("Sueño saludable (≥ 7h)")
            .attr("fill", "#94A3B8")
            .style("font-family", "system-ui, sans-serif")
            .style("font-size", "11px");

        grupoEjes.transition().duration(800).attr("opacity", 1);
        
        // --- 3. CONSTANCIA DE OBJETOS ---
        const posicionesActuales = new Map();
        contenedor.selectAll(".estudiante").each(function(d) {
            if (d && d.id !== undefined) {
                posicionesActuales.set(String(d.id), {
                    x: +d3.select(this).attr("cx"),
                    y: +d3.select(this).attr("cy")
                });
            }
        });

        const esEntradaNueva = posicionesActuales.size === 0;

        const nodos = datosLimpios.map(d => {
            const posInicial = esEntradaNueva
                ? { x: ancho / 2 + (Math.random() - 0.5) * 60, y: alto + 40 }
                : { x: Math.random() * ancho, y: -50 };
            const posAnterior = posicionesActuales.get(String(d.id)) || posInicial;
            return Object.assign({}, d, { radius: 5, x: posAnterior.x, y: posAnterior.y });
        });

        // --- 4. RENDERIZADO Y FÍSICA ---
        const circulos = contenedor.selectAll(".estudiante").data(nodos, d => String(d.id));

        const enter = circulos.enter().append("circle")
            .attr("class", "estudiante")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 0); 

        const todosLosPuntos = enter.merge(circulos);

        todosLosPuntos.transition()
            .delay(() => esEntradaNueva ? Math.random() * 500 : 0)
            .duration(800)
            .attr("r", d => d.radius)
            .attr("fill", d => escalaColor(d.Sleep_Duration))
            .attr("opacity", 0.85);

        circulos.exit().transition().duration(400).attr("r", 0).remove();

        if (simulacion) simulacion.stop();
        simulacion = d3.forceSimulation(nodos)
            .force("x", d3.forceX(d => escalaX(d.Sleep_Duration)).strength(0.08)) 
            .force("y", d3.forceY(d => escalaY(d.University_Year) || (alto / 2)).strength(0.08))
            .force("colision", d3.forceCollide().radius(6.5).iterations(3)) 
            .alphaDecay(0.02) 
            .on("tick", () => {
                todosLosPuntos
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

        // --- 5. INTERACTIVIDAD ROBUSTA (HOVER) ---
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

                const estado = d.Sleep_Duration < 7 ? "Deuda de sueño" : "Sueño saludable";
                const colorTexto = d.Sleep_Duration < 7 ? "#FBBF24" : "#818CF8";

                tooltip
                    .style("visibility", "visible")
                    .style("opacity", 1)
                    .html(`
                        <strong style="color: #818CF8; font-size: 13px;">Estudiante #${d.id}</strong>
                        <hr style="margin:6px 0; border:0; border-top:1px solid rgba(255,255,255,0.15);">
                        Año Universitario: <b>${d.University_Year}</b><br>
                        Horas de sueño: <b>${(+d.Sleep_Duration).toFixed(1)} h</b> 
                        <span style="color: ${colorTexto}; font-weight: 600;">(${estado})</span>
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
    } 

    return { dibujar };
})();