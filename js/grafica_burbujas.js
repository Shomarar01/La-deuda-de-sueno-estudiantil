const graficaBurbujas = (function() {

    function dibujar(contenedor, datos, ancho, alto) {
        // --- ESCALAS ---
        const escalaX = d3.scaleLinear().domain([0, 10.5]).range([0, ancho]);
        const escalaY = d3.scaleLinear().domain([0, 11]).range([alto, 0]);
        const escalaRadio = d3.scaleSqrt().domain([0, 15]).range([3, 22]);
        
        // CORRECCIÓN: Colores sólidos originales para mantener la identidad
        const escalaColor = d3.scaleThreshold().domain([7]).range(["#FB7185", "#34D399"]);

        // --- TRANSICIONES Y LIMPIEZA ---
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

        // --- MOTOR DE CONSTANCIA DE OBJETOS ---
        const circulos = contenedor.selectAll(".estudiante").data(datos, d => d.global_id);

        circulos.join(
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
                    // CORRECCIÓN: Borramos explícitamente cualquier contorno residual
                    .attr("stroke", "none") 
                    .attr("opacity", 0.9)
                ),
            
            exit => exit.transition().duration(500).attr("r", 0).remove()
        );
        
        // Mandamos las burbujas pequeñas al frente para que sean visibles
        contenedor.selectAll(".estudiante").sort((a, b) => b.variabilidad_horario - a.variabilidad_horario);
    }

    return { dibujar };
})();