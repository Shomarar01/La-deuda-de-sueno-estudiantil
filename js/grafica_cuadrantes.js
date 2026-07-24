const graficaEfectoDomino = (function() {
    let simulacion;

    // Paleta de color oficial de la aplicación
    const COLOR_AMBAR = "#FBBF24";       // Pantallas + Cafeína
    const COLOR_PURPURA = "#A855F7";     // Pantallas o Cafeína
    const COLOR_LAVANDA = "#818CF8";     // Hábitos saludables

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

    function dibujar(contenedor, datasetUnificado, ancho, alto) {
        // =====================================================
        // 1. LIMPIEZA PROFUNDA DE ESCENAS PREVIAS
        // =====================================================
        if (simulacion) simulacion.stop();

        contenedor.selectAll(".ejes, .ejes-reloj, .ejes-cuadrantes, .enlace-jetlag, .punto-destino, .zona-saludable, .g-mapa, .leyenda-enjambre, .linea-base").remove();

        const tooltip = crearTooltip();
        tooltip.style("visibility", "hidden").style("opacity", 0);

        // =====================================================
        // 2. CLASIFICACIÓN DE HABITOS Y COLOR SINCRO
        // =====================================================
        const datosLimpios = (datasetUnificado || []).map((d, index) => {
            const idValido = (d.id_unico !== undefined && d.id_unico !== null)
                ? String(d.id_unico)
                : ((d.id !== undefined && d.id !== null) ? String(d.id) : `estudiante-${index}`);

            // Evaluación de pantallas y cafeína
            const pantallas = String(
                d.pantallas ||
                d["11. How often do you use electronic devices (e.g., phone, computer) before going to sleep?"] ||
                ""
            ).toLowerCase();

            const cafe = String(
                d.caffeine ||
                d["12. How often do you consume caffeine (coffee, energy drinks) to stay awake or alert?"] ||
                ""
            ).toLowerCase();

            const usaPantallas = pantallas.includes("often") || pantallas.includes("every") || pantallas.includes("frecuentemente");
            const usaCafe = cafe.includes("often") || cafe.includes("every") || cafe.includes("frecuentemente");

            // Mapeo según la paleta de 3 colores
            let colorNodo = COLOR_LAVANDA;
            let habitoTexto = "Hábitos saludables";

            if (usaPantallas && usaCafe) {
                colorNodo = COLOR_AMBAR;
                habitoTexto = "Pantallas y Cafeína";
            } else if (usaPantallas || usaCafe) {
                colorNodo = COLOR_PURPURA;
                habitoTexto = "Pantallas o Cafeína";
            }

            // Calidad de sueño (Eje X: 1 a 5)
            const suenio = String(
                d.sleep_quality ||
                d["6. How would you rate the overall quality of your sleep?"] ||
                ""
            ).toLowerCase();

            let scoreSuenio = 3;
            if (suenio.includes("very poor") || suenio.includes("muy mala")) scoreSuenio = 1;
            else if (suenio.includes("poor") || suenio.includes("mala")) scoreSuenio = 2;
            else if (suenio.includes("very good") || suenio.includes("excelente")) scoreSuenio = 5;
            else if (suenio.includes("good") || suenio.includes("buena")) scoreSuenio = 4;

            // Rendimiento académico / GPA (Eje Y: 1 a 5)
            const rend = String(
                d.academic_performance ||
                d["15. How would you rate your overall academic performance (GPA or grades) in the past semester?"] ||
                ""
            ).toLowerCase();

            let scoreRend = 3;
            if (rend.includes("poor") || rend.includes("bajo") || rend.includes("deficiente")) scoreRend = 1;
            else if (rend.includes("below") || rend.includes("regular")) scoreRend = 2;
            else if (rend.includes("excellent") || rend.includes("excelente")) scoreRend = 5;
            else if (rend.includes("good") || rend.includes("bueno")) scoreRend = 4;

            return {
                ...d,
                id_unico: idValido,
                colorNodo: colorNodo,
                habitoTexto: habitoTexto,
                scoreSuenio: scoreSuenio,
                scoreRend: scoreRend,
                radius: 4.5
            };
        });

        if (datosLimpios.length === 0) {
            console.warn("graficaEfectoDomino: No hay datos válidos para renderizar.");
            return;
        }

        // =====================================================
        // 3. EJES Y LEYENDA TRICOLOR
        // =====================================================
        const cx = ancho / 2;
        const cy = alto / 2;

        const grupoEjes = contenedor.append("g")
            .attr("class", "ejes ejes-cuadrantes")
            .attr("opacity", 0);

        // Guías transversales
        grupoEjes.append("line")
            .attr("x1", 40).attr("y1", cy).attr("x2", ancho - 40).attr("y2", cy)
            .attr("stroke", "rgba(148, 163, 184, 0.25)")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4 4");

        grupoEjes.append("line")
            .attr("x1", cx).attr("y1", 40).attr("x2", cx).attr("y2", alto - 40)
            .attr("stroke", "rgba(148, 163, 184, 0.25)")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4 4");

        // Rótulos de cuadrante
        const estiloTexto = (sel) => sel
            .attr("fill", "#94A3B8")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "12px")
            .style("font-weight", "500");

        grupoEjes.append("text").attr("x", 30).attr("y", 35).call(estiloTexto).text("↖ Alto Rend. / Mal Sueño");
        grupoEjes.append("text").attr("x", ancho - 30).attr("y", 35).attr("text-anchor", "end").call(estiloTexto).text("Alto Rend. / Buen Sueño ↗");
        grupoEjes.append("text").attr("x", 30).attr("y", alto - 20).call(estiloTexto).text("↙ Bajo Rend. / Mal Sueño");
        grupoEjes.append("text").attr("x", ancho - 30).attr("y", alto - 20).attr("text-anchor", "end").call(estiloTexto).text("Bajo Rend. / Buen Sueño ↘");

        // Leyenda Unificada
        const grupoLeyenda = grupoEjes.append("g")
            .attr("transform", `translate(${cx - 210}, 18)`);

        // Ámbar
        grupoLeyenda.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 5).attr("fill", COLOR_AMBAR);
        grupoLeyenda.append("text").attr("x", 10).attr("y", 4)
            .text("Pantallas y Cafeína")
            .attr("fill", "#F1F5F9")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "11px");

        // Púrpura Neón
        grupoLeyenda.append("circle").attr("cx", 145).attr("cy", 0).attr("r", 5).attr("fill", COLOR_PURPURA);
        grupoLeyenda.append("text").attr("x", 155).attr("y", 4)
            .text("Pantallas o Cafeína")
            .attr("fill", "#F1F5F9")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "11px");

        // Azul Lavanda
        grupoLeyenda.append("circle").attr("cx", 285).attr("cy", 0).attr("r", 5).attr("fill", COLOR_LAVANDA);
        grupoLeyenda.append("text").attr("x", 295).attr("y", 4)
            .text("Hábitos saludables")
            .attr("fill", "#F1F5F9")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "11px");

        grupoEjes.transition().duration(600).attr("opacity", 1);

        // =====================================================
        // 4. SIMULACIÓN DE POSICIONAMIENTO
        // =====================================================
        const paddingX = 120;
        const paddingY = 90;
        const escalaX = d3.scaleLinear().domain([1, 5]).range([paddingX, ancho - paddingX]);
        const escalaY = d3.scaleLinear().domain([1, 5]).range([alto - paddingY, paddingY]);

        const nodosSimulacion = datosLimpios.map(d => Object.assign({}, d));

        simulacion = d3.forceSimulation(nodosSimulacion)
            .force("x", d3.forceX(d => escalaX(d.scoreSuenio)).strength(1.2))
            .force("y", d3.forceY(d => escalaY(d.scoreRend)).strength(1.2))
            .force("colision", d3.forceCollide().radius(5.5).iterations(3))
            .stop();

        for (let i = 0; i < 150; i++) simulacion.tick();

        datosLimpios.forEach((d, i) => {
            d.destinoX = Math.max(20, Math.min(ancho - 20, nodosSimulacion[i].x));
            d.destinoY = Math.max(20, Math.min(alto - 20, nodosSimulacion[i].y));
        });

        // =====================================================
        // 5. RENDERIZADO Y TRANSICIÓN DE CÍRCULOS
        // =====================================================
        const circulos = contenedor.selectAll(".estudiante")
            .data(datosLimpios, d => d.id_unico);

        circulos.join(
            enter => enter.append("circle")
                .attr("class", "estudiante")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", 0)
                .attr("fill", d => d.colorNodo)
                .call(enter => enter.transition().duration(1000).ease(d3.easeCubicOut)
                    .attr("cx", d => d.destinoX)
                    .attr("cy", d => d.destinoY)
                    .attr("r", d => d.radius)
                    .attr("opacity", 0.9)
                ),

            update => update
                .call(update => update.transition().duration(1000).ease(d3.easeCubicInOut)
                    .attr("cx", d => d.destinoX)
                    .attr("cy", d => d.destinoY)
                    .attr("r", d => d.radius)
                    .attr("fill", d => d.colorNodo)
                    .attr("stroke", "none")
                    .attr("opacity", 0.9)
                ),

            exit => exit.transition().duration(400).attr("r", 0).remove()
        );

        const todosLosPuntos = contenedor.selectAll(".estudiante");
        todosLosPuntos.raise();

        // =====================================================
        // 6. INTERACTIVIDAD Y TOOLTIP
        // =====================================================
        const mapSuenioLabel = { 1: "Muy mala", 2: "Mala", 3: "Regular", 4: "Buena", 5: "Excelente" };
        const mapRendLabel = { 1: "Deficiente", 2: "Bajo", 3: "Regular", 4: "Bueno", 5: "Excelente" };

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

                tooltip
                    .style("visibility", "visible")
                    .style("opacity", 1)
                    .html(`
                        <strong style="color: #818CF8; font-size: 13px;">Estudiante #${d.id_unico}</strong>
                        <hr style="margin:6px 0; border:0; border-top:1px solid rgba(255,255,255,0.15);">
                        Calidad de Sueño: <b>${mapSuenioLabel[d.scoreSuenio]} (${d.scoreSuenio}/5)</b><br>
                        Rendimiento Académico: <b>${mapRendLabel[d.scoreRend]} (${d.scoreRend}/5)</b><br>
                        Hábitos nocturnos: <span style="color: ${d.colorNodo}; font-weight: 600;">${d.habitoTexto}</span>
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
                    .attr("opacity", 0.9)
                    .attr("stroke", "none");

                tooltip
                    .style("visibility", "hidden")
                    .style("opacity", 0);
            });
    }

    return { dibujar };
})();