const graficaBurbujas = (function() {

    function crearTooltip() {
        let tooltip = d3.select("body").select(".tooltip-global");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div").attr("class", "tooltip-global")
                .style("position", "absolute").style("pointer-events", "none")
                .style("background", "rgba(18, 20, 36, 0.96)").style("color", "#FFFFFF")
                .style("border", "1px solid rgba(255, 255, 255, 0.2)").style("border-radius", "8px")
                .style("padding", "10px 14px").style("font-family", "system-ui, sans-serif")
                .style("font-size", "12px").style("box-shadow", "0 8px 24px rgba(0,0,0,0.7)")
                .style("opacity", 0).style("visibility", "hidden").style("z-index", 2000);
        }
        return tooltip;
    }

    function dibujar(contenedor, datos, ancho, alto) {
        const datosLimpios = (datos || []).filter(d => d.TotalSleepTime_Horas !== undefined && !isNaN(d.TotalSleepTime_Horas) && d.gpa_promedio !== undefined && !isNaN(d.gpa_promedio));

       // --- ESCALAS ---
        const escalaX = d3.scaleLinear().domain([0, 10.5]).range([0, ancho]);
        const escalaY = d3.scaleLinear().domain([0, 10.5]).range([alto, 0]);
        const escalaRadio = d3.scaleSqrt().domain([0, 15]).range([3, 16]);

        const escalaColor = d3.scaleThreshold()
            .domain([7])
            .range(["#FBBF24", "#818CF8"]);

        contenedor.selectAll(".ejes").remove();
        const grupoEjes = contenedor.append("g").attr("class", "ejes").attr("opacity", 0);

        // --- DIBUJO DE EJES ---
        const ejeX = d3.axisBottom(escalaX)
            .ticks(10)
            .tickFormat(d => d);
        grupoEjes.append("g").attr("transform", `translate(0,${alto})`).call(ejeX).attr("color", "#94A3B8").style("font-size", "12px");
        grupoEjes.append("text").attr("x", ancho / 2).attr("y", alto + 45).attr("fill", "#94A3B8").style("font-size", "13px").style("text-anchor", "middle").text("Horas de sueño promedio");

        const ejeY = d3.axisLeft(escalaY).ticks(6);
        grupoEjes.append("g").call(ejeY).attr("color", "#94A3B8").style("font-size", "12px");
        grupoEjes.append("text").attr("transform", "rotate(-90)").attr("y", -45).attr("x", -(alto / 2)).attr("fill", "#94A3B8").style("font-size", "13px").style("text-anchor", "middle").text("Promedio Académico (0 - 10)");

        grupoEjes.transition().duration(600).attr("opacity", 1);


        const posActuales = new Map();
        contenedor.selectAll(".estudiante").each(function(d) {
            if (d && d.id !== undefined) posActuales.set(String(d.id), { x: +d3.select(this).attr("cx"), y: +d3.select(this).attr("cy"), r: +d3.select(this).attr("r") });
        });

        const tooltip = crearTooltip();
        const circulos = contenedor.selectAll(".estudiante").data(datosLimpios, d => String(d.id));

        const todosLosPuntos = circulos.join(
            // burbuja nace en una posición X aleatoria y fuera de la pantalla arriba/abajo
            enter => enter.append("circle").attr("class", "estudiante")
                .attr("cx", d => Math.random() * ancho)
                .attr("cy", d => Math.random() > 0.5 ? -60 : alto + 60)
                .attr("r", 0)
                .attr("fill", d => escalaColor(d.TotalSleepTime_Horas)).attr("opacity", 0.85)
                .call(enter => enter.transition().duration(1200)
                    .delay((d, i) => i * 3) // etraso unico por punto
                    .ease(d3.easeCubicOut)
                    .attr("cx", d => escalaX(d.TotalSleepTime_Horas))
                    .attr("cy", d => escalaY(d.gpa_promedio))
                    .attr("r", d => escalaRadio(d.variabilidad_horario))),
            
            update => update.call(update => update.interrupt().transition().duration(800).ease(d3.easeCubicOut)
                    .attr("cx", d => escalaX(d.TotalSleepTime_Horas))
                    .attr("cy", d => escalaY(d.gpa_promedio))
                    .attr("r", d => escalaRadio(d.variabilidad_horario))
                    .attr("fill", d => escalaColor(d.TotalSleepTime_Horas)).attr("stroke", "none").attr("opacity", 0.85)),
            
            exit => exit.transition().duration(400).attr("r", 0).remove()
        );

        todosLosPuntos.style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).raise();
                contenedor.selectAll(".estudiante").transition("foco").duration(150).attr("opacity", 0.15);
                d3.select(this).transition("foco").duration(150).attr("opacity", 1).attr("stroke", "#FFFFFF").attr("stroke-width", 2);

                tooltip.style("visibility", "visible").style("opacity", 1).html(`
                    <strong style="color: #818CF8; font-size: 13px;">Estudiante #${d.id}</strong>
                    <hr style="margin:6px 0; border:0; border-top:1px solid rgba(255,255,255,0.15);">
                    Sueño: <b>${(+d.TotalSleepTime_Horas).toFixed(1)} h</b><br>
                    Rendimiento: <b>${(+d.gpa_promedio).toFixed(1)} / 10</b><br>
                    <span style="color: #A855F7;">Variabilidad: <b>${(+d.variabilidad_horario).toFixed(2)}</b></span>
                `);
            }).on("mousemove", e => tooltip.style("left", (e.pageX + 16) + "px").style("top", (e.pageY - 20) + "px"))
            .on("mouseout", function() {
                contenedor.selectAll(".estudiante").transition("foco").duration(150).attr("opacity", 0.85).attr("stroke", "none");
                tooltip.style("visibility", "hidden").style("opacity", 0);
            });

        contenedor.selectAll(".estudiante").sort((a, b) => b.variabilidad_horario - a.variabilidad_horario);
    }
    return { dibujar };
})();