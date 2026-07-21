const graficaReloj = (function() {

    function dibujar(contenedor, datos, ancho, alto) {
        const cx = ancho / 2;
        const cy = alto / 2;
        // AUMENTAMOS EL TAMAÑO: Redujimos el margen de resta para que expanda casi al límite
        // Aumentamos drásticamente el tamaño invadiendo un poco el margen seguro
        const radioMax = Math.min(ancho, alto) / 2 + 25;

        const escalaAngulo = d3.scaleLinear().domain([0, 24]).range([0, 2 * Math.PI]);
        const escalaRadio = d3.scaleLinear().domain([4, 10]).range([40, radioMax]);
        const escalaColor = d3.scaleThreshold().domain([7]).range(["#FB7185", "#34D399"]);

        contenedor.selectAll(".ejes").transition().duration(500).attr("opacity", 0).remove();
        
        contenedor.selectAll(".ejes-reloj").remove();
        const grupoReloj = contenedor.append("g").attr("class", "ejes-reloj").attr("opacity", 0);

        const horasReferencia = [4, 6, 8, 10];
        grupoReloj.selectAll(".circulo-eje")
            .data(horasReferencia).enter().append("circle")
            .attr("cx", cx).attr("cy", cy).attr("r", d => escalaRadio(d))
            .attr("fill", "none")
            .attr("stroke", "rgba(99, 102, 241, 0.15)") 
            .attr("stroke-dasharray", "4 4");

        const horasReloj = [0, 6, 12, 18];
        const etiquetasHoras = ["Media noche", "6 AM", "Medio día", "6 PM"];
        
        grupoReloj.selectAll(".linea-hora")
            .data(horasReloj).enter().append("line")
            .attr("x1", cx).attr("y1", cy)
            .attr("x2", d => cx + radioMax * Math.cos(escalaAngulo(d) - Math.PI/2))
            .attr("y2", d => cy + radioMax * Math.sin(escalaAngulo(d) - Math.PI/2))
            .attr("stroke", "rgba(99, 102, 241, 0.3)");

        grupoReloj.selectAll(".texto-hora")
            .data(horasReloj).enter().append("text")
            // Ajustamos el texto para que quede pegado al nuevo borde más grande
            .attr("x", d => cx + (radioMax + 15) * Math.cos(escalaAngulo(d) - Math.PI/2))
            .attr("y", d => cy + (radioMax + 15) * Math.sin(escalaAngulo(d) - Math.PI/2))
            .attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "12px")
            .style("text-anchor", "middle").attr("alignment-baseline", "middle")
            .text((d, i) => etiquetasHoras[i]);

        grupoReloj.transition().duration(1000).attr("opacity", 1);

        const enlaces = contenedor.selectAll(".enlace-jetlag").data(datos, d => d.global_id);


        // --- 3.5 DIBUJAR PUNTOS DE DESTINO (FIN DE SEMANA) ---
        // Estos son los puntitos pequeños al final de las líneas para que no se vean "rotas"
        const puntosDestino = contenedor.selectAll(".punto-destino").data(datos, d => d.global_id);

        puntosDestino.join(
            enter => enter.append("circle")
                .attr("class", "punto-destino")
                .attr("fill", "rgba(251, 113, 133, 0.6)") // Un rojito transparente
                .attr("r", 0) // Empiezan en tamaño 0
                .attr("cx", d => {
                    // Nacen en el punto original (entre semana)
                    return cx + escalaRadio(d.Sleep_Duration) * Math.cos(escalaAngulo(d.Weekday_Sleep_Start) - Math.PI/2);
                })
                .attr("cy", d => {
                    return cy + escalaRadio(d.Sleep_Duration) * Math.sin(escalaAngulo(d.Weekday_Sleep_Start) - Math.PI/2);
                })
                .call(enter => enter.transition().duration(800).delay(800) // Se mueven junto con la línea
                    .attr("cx", d => {
                        // Viajan a la coordenada del fin de semana
                        return cx + escalaRadio(d.Sleep_Duration) * Math.cos(escalaAngulo(d.Weekend_Sleep_Start) - Math.PI/2);
                    })
                    .attr("cy", d => {
                        return cy + escalaRadio(d.Sleep_Duration) * Math.sin(escalaAngulo(d.Weekend_Sleep_Start) - Math.PI/2);
                    })
                    .attr("r", 2.5) // Se hacen visibles como un puntito pequeño
                ),
            update => update.attr("opacity", 1),
            exit => exit.transition().duration(300).attr("opacity", 0).remove()
        );


        enlaces.join(
            enter => enter.append("path")
                .attr("class", "enlace-jetlag")
                .attr("fill", "none")
                .attr("stroke", "rgba(251, 113, 133, 0.15)") 
                .attr("stroke-width", 1)
                .attr("d", d => {
                    const r = escalaRadio(d.Sleep_Duration);
                    const ang1 = escalaAngulo(d.Weekday_Sleep_Start) - Math.PI/2;
                    const x1 = cx + r * Math.cos(ang1);
                    const y1 = cy + r * Math.sin(ang1);
                    return `M ${x1} ${y1} Q ${cx} ${cy} ${x1} ${y1}`;
                })
                .call(enter => enter.transition().duration(800).delay(1500) 
                    .attr("d", d => {
                        const r = escalaRadio(d.Sleep_Duration);
                        const ang1 = escalaAngulo(d.Weekday_Sleep_Start) - Math.PI/2;
                        const ang2 = escalaAngulo(d.Weekend_Sleep_Start) - Math.PI/2;
                        const x1 = cx + r * Math.cos(ang1);
                        const y1 = cy + r * Math.sin(ang1);
                        const x2 = cx + r * Math.cos(ang2);
                        const y2 = cy + r * Math.sin(ang2);
                        return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
                    })
                ),
            update => update.attr("opacity", 1),
            exit => exit.transition().duration(300).attr("opacity", 0).remove()
        );

        const circulos = contenedor.selectAll(".estudiante").data(datos, d => d.global_id);

        circulos.join(
            enter => enter.append("circle")
                .attr("class", "estudiante")
                .attr("cx", cx).attr("cy", cy).attr("r", 0)
                .attr("fill", d => escalaColor(d.Sleep_Duration))
                .call(enter => enter.transition().duration(1500).ease(d3.easeCubicOut)
                    .attr("cx", d => cx + escalaRadio(d.Sleep_Duration) * Math.cos(escalaAngulo(d.Weekday_Sleep_Start) - Math.PI/2))
                    .attr("cy", d => cy + escalaRadio(d.Sleep_Duration) * Math.sin(escalaAngulo(d.Weekday_Sleep_Start) - Math.PI/2))
                    .attr("r", 4) 
                    .attr("opacity", 0.9)
                ),
            
            update => update
                .call(update => update.transition().duration(1500).ease(d3.easeCubicOut)
                    .attr("cx", d => cx + escalaRadio(d.Sleep_Duration) * Math.cos(escalaAngulo(d.Weekday_Sleep_Start) - Math.PI/2))
                    .attr("cy", d => cy + escalaRadio(d.Sleep_Duration) * Math.sin(escalaAngulo(d.Weekday_Sleep_Start) - Math.PI/2))
                    .attr("r", 4)
                    .attr("fill", d => escalaColor(d.Sleep_Duration))
                    .attr("opacity", 0.9)
                ),
            
            exit => exit.transition().duration(800).attr("r", 0).remove()
        );

        contenedor.selectAll(".estudiante").raise();
    }

    return { dibujar };
})();