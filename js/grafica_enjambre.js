const graficaEnjambre = (function() {
    let simulacion;

    function dibujar(contenedor, datos, ancho, alto) {
        // --- RUTINA DE LIMPIEZA CORREGIDA ---
        // Se movió adentro de la función y le agregamos .interrupt() para frenar transiciones cruzadas
        contenedor.selectAll(".estudiante")
            .interrupt().interrupt("ocultar")
            .on("mouseover", null)
            .on("mousemove", null)
            .on("mouseout", null)
            .attr("stroke", "none")
            .attr("opacity", 0.9);
            
        d3.select("body").select(".tooltip-global").style("opacity", 0);

        // --- EL ESCUDO ANTI-NaN ---
        // Filtramos para evitar que la simulación de fuerzas colapse
        const datosLimpios = datos.filter(d => 
            d.Sleep_Duration !== undefined && 
            d.University_Year !== undefined
        );

        // --- 1. ESCALAS ---
        const escalaX = d3.scaleLinear().domain([4, 10]).range([0, ancho]);
        const categoriasAnio = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
        const escalaY = d3.scalePoint().domain(categoriasAnio).range([0, alto]).padding(0.5);
        // Mismo gradiente continuo que en la escena del reloj (misma variable,
        // misma escena "Kaggle"): evita que el código de color cambie de
        // binario a continuo entre una escena y la siguiente.
        const escalaColor = d3.scaleLinear().domain([4, 10]).range(["#FDA4AF", "#5EEAD4"]).clamp(true);

        // --- 2. EJES Y LEYENDAS ---
        contenedor.selectAll(".ejes").remove();
        const grupoEjes = contenedor.append("g").attr("class", "ejes").attr("opacity", 0);

        const ejeX = d3.axisBottom(escalaX).ticks(6).tickFormat(d => d);
        grupoEjes.append("g").attr("transform", `translate(0,${alto})`).call(ejeX)
            .attr("color", "#94A3B8").style("font-size", "14px").style("font-family", "Inter");

        grupoEjes.append("text").attr("x", ancho / 2).attr("y", alto + 50)
            .attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px")
            .style("text-anchor", "middle").text("Horas de sueño");

        const ejeY = d3.axisLeft(escalaY).tickFormat(d => String(d).charAt(0)); 
        grupoEjes.append("g").call(ejeY)
            .attr("color", "#F1F5F9").style("font-size", "14px").style("font-family", "Inter");

        grupoEjes.append("text").attr("transform", "rotate(-90)")
            .attr("y", -60).attr("x", -(alto / 2))
            .attr("fill", "#94A3B8").style("font-family", "Inter").style("font-size", "14px")
            .style("text-anchor", "middle").text("Año Universitario");

        const leyenda = grupoEjes.append("g").attr("transform", `translate(${ancho / 2 - 120}, -40)`);
        leyenda.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 6).attr("fill", "#FDA4AF");
        leyenda.append("text").attr("x", 15).attr("y", 5).text("Deuda de sueño (< 7h)")
            .attr("fill", "#F1F5F9").style("font-family", "Inter").style("font-size", "13px");
        leyenda.append("circle").attr("cx", 180).attr("cy", 0).attr("r", 6).attr("fill", "#5EEAD4");
        leyenda.append("text").attr("x", 195).attr("y", 5).text("Sueño saludable")
            .attr("fill", "#F1F5F9").style("font-family", "Inter").style("font-size", "13px");

        grupoEjes.transition().duration(1000).attr("opacity", 1);
        
        // --- 3. CONSTANCIA DE OBJETOS ---
        // OJO: esto solo recupera posición si el punto YA existía como
        // ".estudiante" (es decir, si venimos de la escena del reloj, que
        // comparte el mismo dataset de Kaggle). Si venimos del mapa (escena 0)
        // no hay ningún punto previo que recuperar -- el mapa es agregado por
        // país, no tiene un "estudiante" del que viajar -- así que es
        // intencional que en ese caso entren como una entrada nueva, no como
        // un viaje.
        const posicionesActuales = new Map();
        contenedor.selectAll(".estudiante").each(function(d) {
            posicionesActuales.set(String(d.id), {
                x: +d3.select(this).attr("cx"),
                y: +d3.select(this).attr("cy")
            });
        });

        const esEntradaNueva = posicionesActuales.size === 0;

        const nodos = datosLimpios.map(d => {
            // Entrada nueva: todos "entran" agrupados por abajo al centro,
            // como si llegaran a la universidad, en vez de aparecer ya
            // dispersos por todo el ancho (que se sentía como que no pasaba nada).
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
            .delay(() => esEntradaNueva ? Math.random() * 500 : 0) // escalonado solo en la entrada nueva
            .duration(900)
            .attr("r", d => d.radius)
            .attr("fill", d => escalaColor(d.Sleep_Duration))
            .attr("opacity", 0.9);

        circulos.exit().transition().duration(500).attr("r", 0).remove();

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
    } 

    return { dibujar };
})();