// --- 2. GRÁFICA DE BEESWARM CORREGIDA (graficaEfectoDomino.js) ---

const graficaEfectoDomino = (function() {
    let simulacion;

    // Recibe el dataset unificado, no los datosCrudos crudos de Mendeley
    function dibujar(contenedor, datasetUnificado, ancho, alto) {
        // --- 2.1 CÁLCULO INTERNO DE LOS CUADRANTES (Sin diffing) ---
        // Procesamos los datos internos para la simulación de fuerzas
        const datosLimpios = datasetUnificado.map(d => {
            // Lógica de cálculo de cuadrantes (idéntica a la original)
            const pantallas = d["11. How often do you use electronic devices (e.g., phone, computer) before going to sleep?"] || "";
            const cafe = d["12. How often do you consume caffeine (coffee, energy drinks) to stay awake or alert?"] || "";
            const malosHabitos = (pantallas.includes("Often") || pantallas.includes("Every") || cafe.includes("Often") || cafe.includes("Every"));

            const suenio = d["6. How would you rate the overall quality of your sleep?"] || "";
            let scoreSuenio = 3; 
            if (suenio.includes("Very poor")) scoreSuenio = 1;
            else if (suenio.includes("Poor")) scoreSuenio = 2;
            else if (suenio.includes("Very good")) scoreSuenio = 5;
            else if (suenio.includes("Good")) scoreSuenio = 4;

            const rend = d["15. How would you rate your overall academic performance (GPA or grades) in the past semester?"] || "";
            let scoreRend = 3;
            if (rend.includes("Poor")) scoreRend = 1;
            else if (rend.includes("Below")) scoreRend = 2;
            else if (rend.includes("Excellent")) scoreRend = 5;
            else if (rend.includes("Good")) scoreRend = 4;

            return {
                id: d.id, // ID propio de Mendeley (no combinado con otros archivos)
                malosHabitos: malosHabitos,
                scoreSuenio: scoreSuenio,
                scoreRend: scoreRend,
                radius: 4.5
            };
        });

        // --- 2.2 EJES Y TEXTOS (Idéntico a la original) ---
        contenedor.selectAll(".ejes").transition().duration(500).attr("opacity", 0).remove();
        contenedor.selectAll(".ejes-cuadrantes").remove();

        const grupoEjes = contenedor.append("g")
            .attr("class", "ejes ejes-cuadrantes") 
            .attr("opacity", 0);
        
        const cx = ancho / 2;
        const cy = alto / 2;

        grupoEjes.append("line").attr("x1", 0).attr("y1", cy).attr("x2", ancho).attr("y2", cy)
            .attr("stroke", "rgba(148, 163, 184, 0.2)").attr("stroke-width", 2).attr("stroke-dasharray", "4 4");
        grupoEjes.append("line").attr("x1", cx).attr("y1", 0).attr("x2", cx).attr("y2", alto)
            .attr("stroke", "rgba(148, 163, 184, 0.2)").attr("stroke-width", 2).attr("stroke-dasharray", "4 4");

        const estiloTexto = (sel) => sel.attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px").style("font-weight", "500");
        
        grupoEjes.append("text").attr("x", 20).attr("y", 30).call(estiloTexto).text("↖ Alto Rend. / Mal Sueño");
        grupoEjes.append("text").attr("x", ancho - 20).attr("y", 30).attr("text-anchor", "end").call(estiloTexto).text("Alto Rend. / Buen Sueño ↗");
        grupoEjes.append("text").attr("x", 20).attr("y", alto - 20).call(estiloTexto).text("↙ Bajo Rend. / Mal Sueño");
        grupoEjes.append("text").attr("x", ancho - 20).attr("y", alto - 20).attr("text-anchor", "end").call(estiloTexto).text("Bajo Rend. / Buen Sueño ↘");

        grupoEjes.append("circle").attr("cx", cx - 80).attr("cy", 25).attr("r", 5).attr("fill", "#FB7185");
        grupoEjes.append("text").attr("x", cx - 70).attr("y", 30).call(estiloTexto).style("font-size", "12px").text("Usa pantallas/café");
        
        grupoEjes.append("circle").attr("cx", cx + 70).attr("cy", 25).attr("r", 5).attr("fill", "#34D399");
        grupoEjes.append("text").attr("x", cx + 80).attr("y", 30).call(estiloTexto).style("font-size", "12px").text("Hábitos sanos");

        grupoEjes.transition().duration(800).attr("opacity", 1);

        const paddingX = 140; 
        const paddingY = 120;
        const escalaX = d3.scaleLinear().domain([1, 5]).range([paddingX, ancho - paddingX]);
        const escalaY = d3.scaleLinear().domain([1, 5]).range([alto - paddingY, paddingY]); 

        const nodosSimulacion = datosLimpios.map(d => Object.assign({}, d));

        if (simulacion) simulacion.stop();
        
        simulacion = d3.forceSimulation(nodosSimulacion)
            .force("x", d3.forceX(d => escalaX(d.scoreSuenio)).strength(1.2)) 
            .force("y", d3.forceY(d => escalaY(d.scoreRend)).strength(1.2))
            .force("colision", d3.forceCollide().radius(5).iterations(3))
            .stop();

        for (let i = 0; i < 150; i++) simulacion.tick();

        // Guardamos las coordenadas calculadas en el dataset limpio para su uso posterior
        datosLimpios.forEach((d, i) => {
            d.destinoX = nodosSimulacion[i].x;
            d.destinoY = nodosSimulacion[i].y;
        });

        // --- 2.3 MOTOR DE UNIFICACIÓN (REUTILIZACIÓN DE CÍRCULOS) ---
        // Usamos la llave 'id' (propia de Mendeley) para conservar identidad dentro de la escena
        const circulos = contenedor.selectAll(".estudiante")
            .data(datosLimpios, d => String(d.id)); // Forzamos texto estricto

        circulos.join(
            // Círculos Nuevos (No debería haber si unificamos bien)
            enter => enter.append("circle")
                .attr("class", "estudiante")
                .attr("cx", cx).attr("cy", cy).attr("r", 0)
                .attr("fill", d => d.malosHabitos ? "#FB7185" : "#34D399")
                .call(enter => enter.transition().duration(1000).ease(d3.easeCubicOut)
                    .attr("cx", d => d.destinoX)
                    .attr("cy", d => d.destinoY)
                    .attr("r", d => d.radius)
                    .attr("opacity", 0.9)
                ),
            
            // Círculos Existentes (EL VIAJE) - Esto es lo que recuperamos
            update => update
                .call(update => update.transition().duration(1000).ease(d3.easeCubicInOut)
                    .attr("cx", d => d.destinoX)
                    .attr("cy", d => d.destinoY)
                    .attr("r", d => d.radius) // Actualizamos tamaño si es necesario
                    .attr("fill", d => d.malosHabitos ? "#FB7185" : "#34D399")
                    .attr("stroke", "none") // Limpiamos bordes previos
                    .attr("opacity", 0.9)
                ),
            
            exit => exit.transition().duration(500).attr("r", 0).remove()
        );

        // Mandamos los puntos al frente para la leyenda
        contenedor.selectAll(".estudiante").raise();
    }

    return { dibujar };
})();