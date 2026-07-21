const graficaEnjambre = (function() {
    let simulacion;

    function dibujar(contenedor, datos, ancho, alto) {

        // --- 1. ESCALAS ---
        const escalaX = d3.scaleLinear().domain([4, 10]).range([0, ancho]);
        const categoriasAnio = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
        const escalaY = d3.scalePoint().domain(categoriasAnio).range([0, alto]).padding(0.5);
        const escalaColor = d3.scaleThreshold().domain([7]).range(["#FB7185", "#34D399"]);

        // --- 2. EJES Y LEYENDAS (Manejo limpio) ---
        // Borramos los ejes anteriores para que no se sobrepongan si venimos de otra gráfica
        contenedor.selectAll(".ejes").remove();
        const grupoEjes = contenedor.append("g").attr("class", "ejes").attr("opacity", 0);

        const ejeX = d3.axisBottom(escalaX).ticks(6).tickFormat(d => d);
        grupoEjes.append("g").attr("transform", `translate(0,${alto})`).call(ejeX)
            .attr("color", "#94A3B8").style("font-size", "14px").style("font-family", "Inter");

        grupoEjes.append("text").attr("x", ancho / 2).attr("y", alto + 50)
            .attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px")
            .style("text-anchor", "middle").text("Horas de sueño");

        const ejeY = d3.axisLeft(escalaY).tickFormat(d => d.charAt(0)); 
        grupoEjes.append("g").call(ejeY)
            .attr("color", "#F1F5F9").style("font-size", "14px").style("font-family", "Inter");

        grupoEjes.append("text").attr("transform", "rotate(-90)")
            .attr("y", -60).attr("x", -(alto / 2))
            .attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px")
            .style("text-anchor", "middle").text("Año Universitario");

        // Leyenda
        const leyenda = grupoEjes.append("g").attr("transform", `translate(${ancho / 2 - 120}, -40)`);
        leyenda.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 6).attr("fill", "#FB7185");
        leyenda.append("text").attr("x", 15).attr("y", 5).text("Deuda de sueño (< 7h)")
            .attr("fill", "#F1F5F9").style("font-family", "Inter").style("font-size", "13px");
        leyenda.append("circle").attr("cx", 180).attr("cy", 0).attr("r", 6).attr("fill", "#34D399");
        leyenda.append("text").attr("x", 195).attr("y", 5).text("Sueño saludable")
            .attr("fill", "#F1F5F9").style("font-family", "Inter").style("font-size", "13px");

        // Animamos la entrada de los ejes suavemente
        grupoEjes.transition().duration(1000).attr("opacity", 1);

        // --- 3. CÁLCULO DE FUERZAS (El Enjambre) ---
        // Clonamos los datos para que la simulación no modifique el CSV original
        const nodos = datos.map(d => Object.create(d));
        nodos.forEach(d => { d.radius = 5; });

        if (simulacion) simulacion.stop();
        simulacion = d3.forceSimulation(nodos)
            .force("x", d3.forceX(d => escalaX(d.Sleep_Duration)).strength(1))
            .force("y", d3.forceY(d => escalaY(d.University_Year) || (alto / 2)).strength(0.5))
            .force("colision", d3.forceCollide().radius(6).iterations(2))
            .stop();

        // Calculamos todas las posiciones finales instantáneamente
        for (let i = 0; i < 120; i++) simulacion.tick();

        // --- 4. MOTOR DE ANIMACIÓN (Enter, Update, Exit) ---
        // Usamos la clave global_id para que D3 reconozca a cada punto
        const circulos = contenedor.selectAll(".estudiante")
            .data(nodos, d => d.global_id);

        circulos.join(
            // Puntos Nuevos (Enter)
            enter => enter.append("circle")
                .attr("class", "estudiante")
                .attr("cx", ancho / 2)
                .attr("cy", alto / 2)
                .attr("r", 0)
                .attr("fill", d => escalaColor(d.Sleep_Duration))
                .attr("opacity", 0)
                .call(enter => enter.transition().duration(1200).ease(d3.easeCubicOut)
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", d => d.radius)
                    .attr("opacity", 0.9)
                ),
            
            // Puntos Existentes (Update) - ¡AQUÍ ESTÁ LA MAGIA DEL REGRESO ORGÁNICO!
            update => update
                .call(update => update.transition()
                    .duration(750)
                    .ease(d3.easeCubicInOut) // Movimiento más suave
                    .delay((d, i) => i * 0.5) // Retraso escalonado: cada punto sale 1.5ms después del anterior
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("fill", d => escalaColor(d.Sleep_Duration))
                    .attr("r", d => d.radius)
                    .attr("opacity", 0.9)
                ),
            
            // Puntos Sobrantes (Exit)
            exit => exit
                .call(exit => exit.transition().duration(800)
                    .attr("r", 0)
                    .attr("opacity", 0)
                    .remove()
                )
        );
    }
    return { dibujar };
})();
