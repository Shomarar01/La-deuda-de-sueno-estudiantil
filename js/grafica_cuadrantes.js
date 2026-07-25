const graficaEfectoDomino = (function() {
    let simulacion;

    const COLOR_AMBAR = "#FBBF24";       // Pantallas + Cafeína
    const COLOR_LAVANDA = "#818CF8";     // Hábitos saludables

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

    function dibujar(contenedor, datosCrudos, ancho, alto) {

        // datos Mendeley
        const datosLimpios = datosCrudos.map(d => {
            const pantallas = d["11. How often do you use electronic devices (e.g., phone, computer) before going to sleep?"] || "";
            const cafe = d["12. How often do you consume caffeine (coffee, energy drinks) to stay awake or alert?"] || "";
            const malosHabitos = (pantallas.includes("Often") || pantallas.includes("Every") || cafe.includes("Often") || cafe.includes("Every"));

            const suenio = d["6. How would you rate the overall quality of your sleep?"] || "";
            let scoreSuenio = 3;
            if (suenio.includes("Very poor")) scoreSuenio = 1; else if (suenio.includes("Poor")) scoreSuenio = 2; else if (suenio.includes("Very good")) scoreSuenio = 5; else if (suenio.includes("Good")) scoreSuenio = 4;

            const rend = d["15. How would you rate your overall academic performance (GPA or grades) in the past semester?"] || "";
            let scoreRend = 3;
            if (rend.includes("Poor")) scoreRend = 1; else if (rend.includes("Below")) scoreRend = 2; else if (rend.includes("Excellent")) scoreRend = 5; else if (rend.includes("Good")) scoreRend = 4;

            return { global_id: String(d.id), malosHabitos: malosHabitos, scoreSuenio: scoreSuenio, scoreRend: scoreRend, radius: 4.5 };
        });

        // ejes
        contenedor.selectAll(".ejes-cuadrantes").remove();
        const grupoEjes = contenedor.append("g").attr("class", "ejes-cuadrantes").attr("opacity", 1);
        const cx = ancho / 2;
        const cy = alto / 2;

        grupoEjes.append("line").attr("x1", 0).attr("y1", cy).attr("x2", ancho).attr("y2", cy).attr("stroke", "rgba(148, 163, 184, 0.2)").attr("stroke-width", 2).attr("stroke-dasharray", "4 4");
        grupoEjes.append("line").attr("x1", cx).attr("y1", 0).attr("x2", cx).attr("y2", alto).attr("stroke", "rgba(148, 163, 184, 0.2)").attr("stroke-width", 2).attr("stroke-dasharray", "4 4");

        const estiloTexto = (sel) => sel.attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px").style("font-weight", "500");
        
        // cuadrantes en las esquinas
        grupoEjes.append("text").attr("x", 20).attr("y", 45).call(estiloTexto).text("↖ Alto Rend. / Mal Sueño");
        grupoEjes.append("text").attr("x", ancho - 20).attr("y", 45).attr("text-anchor", "end").call(estiloTexto).text("Alto Rend. / Buen Sueño ↗");
        grupoEjes.append("text").attr("x", 20).attr("y", alto - 20).call(estiloTexto).text("↙ Bajo Rend. / Mal Sueño");
        grupoEjes.append("text").attr("x", ancho - 20).attr("y", alto - 20).attr("text-anchor", "end").call(estiloTexto).text("Bajo Rend. / Buen Sueño ↘");

        // LEYENDA ARRIBA Y CENTRADA
        const grupoLeyenda = grupoEjes.append("g").attr("transform", `translate(${cx - 130}, 5)` );

        grupoLeyenda.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 5).attr("fill", COLOR_AMBAR);
        grupoLeyenda.append("text").attr("x", 10).attr("y", 4).call(estiloTexto).style("font-size", "12px").text("Usa pantallas/café");

        grupoLeyenda.append("circle").attr("cx", 140).attr("cy", 0).attr("r", 5).attr("fill", COLOR_LAVANDA);
        grupoLeyenda.append("text").attr("x", 150).attr("y", 4).call(estiloTexto).style("font-size", "12px").text("Hábitos sanos");

        const paddingX = 140; const paddingY = 120;
        const escalaX = d3.scaleLinear().domain([1, 5]).range([paddingX, ancho - paddingX]);
        const escalaY = d3.scaleLinear().domain([1, 5]).range([alto - paddingY, paddingY]);

        const nodosSimulacion = datosLimpios.map(d => Object.assign({}, d));
        if (simulacion) simulacion.stop();
        
        simulacion = d3.forceSimulation(nodosSimulacion)
            .force("x", d3.forceX(d => escalaX(d.scoreSuenio)).strength(1.2))
            .force("y", d3.forceY(d => escalaY(d.scoreRend)).strength(1.2))
            .force("colision", d3.forceCollide().radius(5).iterations(3)).stop();

        for (let i = 0; i < 150; i++) simulacion.tick();
        datosLimpios.forEach((d, i) => { d.destinoX = nodosSimulacion[i].x; d.destinoY = nodosSimulacion[i].y; });


        const tooltip = crearTooltip();
        const circulos = contenedor.selectAll(".estudiante").data(datosLimpios, d => String(d.global_id));

        circulos.exit().transition().duration(400).attr("r", 0).remove();

        const enterCircles = circulos.enter().append("circle")
            .attr("class", "estudiante")
            .attr("cx", d => {
                const borde = Math.floor(Math.random() * 4);
                if (borde === 0) return -50;
                if (borde === 1) return ancho + 50;
                return Math.random() * ancho;
            })
            .attr("cy", d => {
                const borde = Math.floor(Math.random() * 4);
                if (borde === 2) return -50;
                if (borde === 3) return alto + 50;
                return Math.random() * alto;
            })
            .attr("r", 0)
            .attr("opacity", 0)
            .attr("fill", d => d.malosHabitos ? COLOR_AMBAR : COLOR_LAVANDA);

        const allCircles = enterCircles.merge(circulos);

        // hover
        allCircles.style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).raise();
                contenedor.selectAll(".estudiante").transition("foco").duration(150).attr("opacity", 0.15);
                d3.select(this).transition("foco").duration(150).attr("opacity", 1).attr("stroke", "#FFFFFF").attr("stroke-width", 2);

                // cuadrantes
                const textoRend = d.scoreRend > 3 ? "Alto Rendimiento" : "Bajo Rendimiento";
                const textoSuenio = d.scoreSuenio > 3 ? "Buen Sueño" : "Mal Sueño";
                const textoHabitos = d.malosHabitos ? "Usa pantallas/toma café" : "Hábitos sanos";
                const colorHex = d.malosHabitos ? COLOR_AMBAR : COLOR_LAVANDA;

                tooltip.style("visibility", "visible").style("opacity", 1).html(`
                    <strong style="color: ${colorHex}; font-size: 13px;">Estudiante #${d.global_id}</strong>
                    <hr style="margin:6px 0; border:0; border-top:1px solid rgba(255,255,255,0.15);">
                    Cuadrante: <b>${textoRend} y ${textoSuenio}</b><br>
                    Rutina: <span style="color: ${colorHex}; font-weight: 600;">${textoHabitos}</span>
                `);
            })
            .on("mousemove", e => tooltip.style("left", (e.pageX + 16) + "px").style("top", (e.pageY - 20) + "px"))
            .on("mouseout", function() {
                contenedor.selectAll(".estudiante").transition("foco").duration(150).attr("opacity", 0.9).attr("stroke", "none");
                tooltip.style("visibility", "hidden").style("opacity", 0);
            });

        requestAnimationFrame(() => {
            allCircles.transition().duration(1200)
                .ease(d3.easeCubicOut)
                .attr("opacity", 0.9)
                .attr("cx", d => d.destinoX)
                .attr("cy", d => d.destinoY)
                .attr("r", d => d.radius)
                .attr("fill", d => d.malosHabitos ? COLOR_AMBAR : COLOR_LAVANDA);
        });

        contenedor.selectAll(".estudiante").raise();
    }

    return { dibujar };
})();