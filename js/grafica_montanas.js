const graficaMontanas = (function() {
    let simulacion;

    function dibujar(contenedor, datos, ancho, alto) {
        // --- 1. ESCALAS ---
        const datosLimpios = datos.filter(d => d.siestas_min !== undefined && d.Carga_academica);

        const maxSiesta = d3.min([d3.max(datosLimpios, d => d.siestas_min), 180]); 
        const escalaX = d3.scaleLinear().domain([0, maxSiesta]).range([0, ancho]);
        
        const categoriasCarga = ["Baja", "Normal", "Alta"];
        const escalaY = d3.scalePoint().domain(categoriasCarga).range([alto, 0]).padding(0.5);
        
        const escalaColor = d3.scaleThreshold().domain([7]).range(["#FB7185", "#34D399"]);

        // --- 2. TRANSICIONES DE EJES ---
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

        grupoEjes.transition().duration(800).attr("opacity", 1);

        // --- 3. CÁLCULO DE POSICIONES FINALES (MONTAÑAS) ---
        // Creamos nodos temporales para calcular dónde deben terminar las burbujas
        const nodosSimulacion = datosLimpios.map(d => Object.assign({}, d));

        if (simulacion) simulacion.stop();
        
        simulacion = d3.forceSimulation(nodosSimulacion)
            .force("x", d3.forceX(d => escalaX(d.siestas_min)).strength(1))
            .force("y", d3.forceY(d => escalaY(d.Carga_academica)).strength(1))
            .force("colision", d3.forceCollide().radius(5).iterations(2))
            .stop();

        for (let i = 0; i < 120; i++) simulacion.tick();

        // Guardamos las coordenadas calculadas (destinoX, destinoY) directamente en cada objeto de datos original
        datosLimpios.forEach((d, i) => {
            d.destinoX = nodosSimulacion[i].x;
            d.destinoY = nodosSimulacion[i].y;
            d.radius = 4.5;
        });

        // --- 4. MOTOR DE VUELO FLUIDO (Constancia de Objetos Real) ---
        const circulos = contenedor.selectAll(".estudiante").data(datosLimpios, d => d.global_id);

        circulos.join(
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
            
            // ¡Aquí es donde ocurre el viaje físico desde las burbujas hacia las montañas!
            update => update
                .call(update => update.transition()
                    .duration(1000)
                    .ease(d3.easeCubicInOut)
                    .delay((d, i) => i * 0.5) // Retraso escalonado para que parezca un enjambre volando
                    .attr("cx", d => d.destinoX) // Vuelan a la coordenada X de la siesta
                    .attr("cy", d => d.destinoY) // Vuelan a la coordenada Y de su carga académica
                    .attr("r", d => d.radius)    // Se desinflan del tamaño de burbuja a un punto normal
                    .attr("fill", d => escalaColor(d.TotalSleepTime_Horas))
                    .attr("stroke", "none")
                    .attr("opacity", 0.9)
                ),
            
            exit => exit.transition().duration(500).attr("r", 0).remove()
        );
        
        contenedor.selectAll(".estudiante").raise();
    }

    return { dibujar };
})();