const graficaBurbujas = (function() {

    // --- 1. FUNCIÓN PARA EL TOOLTIP GLOBAL ---
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
        // --- ESCUDO ANTI-NaN ---
        const datosLimpios = (datos || []).filter(d =>
            d.TotalSleepTime_Horas !== undefined && !isNaN(d.TotalSleepTime_Horas) &&
            d.gpa_promedio !== undefined && !isNaN(d.gpa_promedio)
        );

        // --- ESCALAS ---
        const escalaX = d3.scaleLinear().domain([0, 10.5]).range([0, ancho]);
        const escalaY = d3.scaleLinear().domain([0, 11]).range([alto, 0]);
        const escalaRadio = d3.scaleSqrt().domain([0, 15]).range([3, 22]);
        const escalaColor = d3.scaleThreshold().domain([7]).range(["#FB7185", "#34D399"]);

        // --- TRANSICIONES Y LIMPIEZA DE ESCENAS ANTERIORES ---
        contenedor.selectAll(".ejes-reloj, .enlace-jetlag, .punto-destino")
            .transition().duration(500).attr("opacity", 0).remove();
            
        contenedor.selectAll(".ejes").remove();
        const grupoEjes = contenedor.append("g").attr("class", "ejes").attr("opacity", 0);

        // --- DIBUJO DE EJES ---
        const ejeX = d3.axisBottom(escalaX).ticks(10).tickFormat(d => d + "h");
        grupoEjes.append("g").attr("transform", `translate(0,${alto})`).call(ejeX)
            .attr("color", "#94A3B8").style("font-size", "14px").style("font-family", "Inter");
        
        grupoEjes.append("text").attr("x", ancho / 2).attr("y", alto + 50)
            .attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px")
            .style("text-anchor", "middle").text("Horas de sueño promedio");

        const ejeY = d3.axisLeft(escalaY).ticks(6);
        grupoEjes.append("g").call(ejeY)
            .attr("color", "#F1F5F9").style("font-size", "14px").style("font-family", "Inter");

        grupoEjes.append("text").attr("transform", "rotate(-90)")
            .attr("y", -50).attr("x", -(alto / 2))
            .attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px")
            .style("text-anchor", "middle").text("Promedio Académico (0 - 10)");

        grupoEjes.transition().duration(800).attr("opacity", 1);

        // --- TOOLTIP Y DIBUJO DE BURBUJAS ---
        const tooltip = crearTooltip();

        const circulos = contenedor.selectAll(".estudiante").data(datosLimpios, d => d.id);

        const todosLosPuntos = circulos.join(
            enter => enter.append("circle")
                .attr("class", "estudiante")
                .attr("cx", ancho / 2).attr("cy", alto / 2).attr("r", 0)
                .attr("fill", d => escalaColor(d.TotalSleepTime_Horas))
                .attr("opacity", 0.9)
                .call(enter => enter.transition().duration(800).ease(d3.easeCubicOut)
                    .attr("cx", d => escalaX(d.TotalSleepTime_Horas))
                    .attr("cy", d => escalaY(d.gpa_promedio))
                    .attr("r", d => escalaRadio(d.variabilidad_horario))
                ),
            
            update => update
                .call(update => update.transition().duration(800).ease(d3.easeCubicOut)
                    .attr("cx", d => escalaX(d.TotalSleepTime_Horas))
                    .attr("cy", d => escalaY(d.gpa_promedio))
                    .attr("r", d => escalaRadio(d.variabilidad_horario))
                    .attr("fill", d => escalaColor(d.TotalSleepTime_Horas))
                    .attr("stroke", "none") 
                    .attr("opacity", 0.9)
                ),
            
            exit => exit.transition().duration(500).attr("r", 0).remove()
        );

        // --- INTERACTIVIDAD ROBUSTA ---
        todosLosPuntos
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                // 1. Traer la burbuja seleccionada al frente para evitar parpadeos con burbujas adyacentes
                d3.select(this).raise();

                // 2. Atenuar las demás
                contenedor.selectAll(".estudiante").transition("foco").duration(150).attr("opacity", 0.2);
                
                // 3. Resaltar la burbuja activa
                d3.select(this).transition("foco").duration(150)
                    .attr("opacity", 1)
                    .attr("stroke", "#FFFFFF")
                    .attr("stroke-width", 2);

                // 4. CORRECCIÓN CLAVE: Activar visibility explícitamente junto con opacity
                tooltip
                    .style("visibility", "visible")
                    .style("opacity", 1)
                    .html(`
                        <strong>Estudiante #${d.id}</strong><hr style="margin:4px 0; border:0; border-top:1px solid #e2e8f0;">
                        Sueño: <b>${d.TotalSleepTime_Horas} h</b><br>
                        Rendimiento: <b>${d.gpa_promedio} / 10</b><br>
                        Variabilidad: <b>${(+d.variabilidad_horario).toFixed(2)}</b>
                    `);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 25) + "px");
            })
            .on("mouseout", function(event, d) {
                // Restaurar la opacidad original de todas las burbujas
                contenedor.selectAll(".estudiante").transition("foco").duration(150)
                    .attr("opacity", 0.9)
                    .attr("stroke", "none");

                // CORRECCIÓN CLAVE: Ocultar con visibility y opacity en simultáneo
                tooltip
                    .style("visibility", "hidden")
                    .style("opacity", 0);
            });
    }

    return { dibujar };
})();