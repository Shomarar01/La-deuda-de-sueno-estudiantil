const graficaMapa = (() => {

    const equivalencias = {
        "United States of America": "United States", "Russian Federation": "Russia",
        "Republic of Korea": "South Korea", "Korea, Republic of": "South Korea",
        "Czech Republic": "Czechia", "Viet Nam": "Vietnam",
        "United Republic of Tanzania": "Tanzania", "Syrian Arab Republic": "Syria",
        "Lao People's Democratic Republic": "Laos", "Iran (Islamic Republic of)": "Iran",
        "Moldova, Republic of": "Moldova", "Bolivia (Plurinational State of)": "Bolivia",
        "Venezuela (Bolivarian Republic of)": "Venezuela"
    };

    function crearIndice(datos) {
        const indice = new Map();
        datos.forEach(d => indice.set(d.country.trim(), d.hours));
        return indice;
    }

    function obtenerNombrePais(feature) {
        let nombre = feature.properties.name;
        if (equivalencias[nombre]) nombre = equivalencias[nombre];
        return nombre;
    }

    function crearTooltip() {
        let tooltip = d3.select("body").select(".tooltip-mapa");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div").attr("class", "tooltip-mapa")
                .style("position", "absolute").style("pointer-events", "none")
                .style("background", "rgba(18, 20, 36, 0.96)").style("color", "#FFFFFF")
                .style("border", "1px solid rgba(255, 255, 255, 0.2)").style("border-radius", "8px")
                .style("padding", "10px 14px").style("font-family", "system-ui, sans-serif")
                .style("font-size", "12px").style("box-shadow", "0 8px 24px rgba(0,0,0,0.7)")
                .style("opacity", 0).style("visibility", "hidden").style("z-index", 2000);
        }
        return tooltip;
    }

    function dibujar(svg, geojson, datos, ancho, alto) {
        // Limpiamos con desvanecimiento
        const mapaPrevio = svg.selectAll(".g-mapa");
        if (!mapaPrevio.empty()) {
            mapaPrevio.interrupt().transition().duration(250).attr("opacity", 0).remove();
        }

        const gMapa = svg.append("g").attr("class", "g-mapa").attr("transform", "translate(0, -30) scale(1.05)");
        const indice = crearIndice(datos);
        const tooltip = crearTooltip();

        const minHoras = d3.min(datos, d => d.hours);
        const maxHoras = d3.max(datos, d => d.hours);
        const puntoMedio = (minHoras + maxHoras) / 2;

        const escalaColor = d3.scaleLinear()
            .domain([minHoras, puntoMedio, maxHoras])
            .range(["#FBBF24", "#A855F7", "#818CF8"]);

        const proyeccion = d3.geoNaturalEarth1().fitExtent([[0, 0], [ancho, alto]], geojson);
        const path = d3.geoPath(proyeccion);

        gMapa.attr("opacity", 0).transition().duration(900).attr("opacity", 1);

        // Renderizamos con pintado progresivo (Efecto Orgánico 2026)
        gMapa.selectAll(".pais")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("class", "pais")
            .attr("d", path)
            .attr("fill", "#1E1B4B") // Color base transparente
            .attr("stroke", "rgba(255, 255, 255, 0.1)")
            .attr("stroke-width", 0.5)
            .style("cursor", "pointer")
            // Animación de llenado individual
            .call(enter => enter.transition()
                .duration(1000)
                .delay((d, i) => i * 2) // Cascada rápida
                .attr("fill", d => {
                    const nombre = obtenerNombrePais(d);
                    const horas = indice.get(nombre);
                    return horas == null ? "#2A2F45" : escalaColor(horas);
                })
            )
            .on("mouseover", function(event, d) {
                if (!d3.select(this).classed("activo")) {
                    d3.select(this).transition().duration(150).attr("stroke", "#FFFFFF").attr("stroke-width", 1.8);
                }
                
                const nombre = obtenerNombrePais(d);
                const horas = indice.get(nombre);
                tooltip.style("visibility", "visible").style("opacity", 1);

                if (horas == null) {
                    tooltip.html(`<strong style="color: #94A3B8;">${nombre}</strong><br>Sin información`);
                    return;
                }
                const deficit = (8 - horas).toFixed(1);
                tooltip.html(`
                    <strong style="color: #818CF8; font-size: 13px;">${nombre}</strong>
                    <hr style="margin:6px 0; border:0; border-top:1px solid rgba(255,255,255,0.15);">
                    Horas promedio: <b>${horas.toFixed(1)} h</b><br>
                    <span style="color: #FBBF24; font-weight: bold;">Déficit respecto a 8h: ${deficit} h</span>
                `);
            })
            .on("mousemove", event => tooltip.style("left", (event.pageX + 18) + "px").style("top", (event.pageY - 25) + "px"))
            .on("mouseout", function() {
                if (!d3.select(this).classed("activo")) {
                    d3.select(this).transition().duration(150).attr("stroke", "rgba(255, 255, 255, 0.2)").attr("stroke-width", 0.5);
                }
                tooltip.style("visibility", "hidden").style("opacity", 0);
            })
            // INTERACTIVIDAD DE CLIC FOCALIZADO
            .on("click", function(event, d) {
                const isActivo = d3.select(this).classed("activo");
                
                gMapa.selectAll(".pais").classed("activo", false)
                    .transition().duration(300)
                    .attr("opacity", 0.2) // Apaga todos
                    .attr("stroke-width", 0.5);
                
                if (!isActivo) {
                    d3.select(this).classed("activo", true)
                        .transition().duration(300)
                        .attr("opacity", 1) // Enciende el seleccionado
                        .attr("stroke", "#FFFFFF")
                        .attr("stroke-width", 2);
                } else {
                    // Doble clic restaura el mapa
                    gMapa.selectAll(".pais").transition().duration(300).attr("opacity", 1);
                }
            });

        // Leyenda
        let defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
        defs.selectAll("#gradiente-sueno").remove();
        const gradient = defs.append("linearGradient").attr("id", "gradiente-sueno");
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "#FBBF24");
        gradient.append("stop").attr("offset", "50%").attr("stop-color", "#A855F7");
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#818CF8");

        const gLeyenda = svg.append("g").attr("class", "leyenda-mapa").attr("transform", `translate(${ancho - 220},${alto - 40})`);
        gLeyenda.attr("opacity", 0).transition().duration(900).attr("opacity", 1);
        gLeyenda.append("rect").attr("width", 180).attr("height", 12).attr("fill", "url(#gradiente-sueno)").attr("rx", 6);
        gLeyenda.append("text").attr("x", 0).attr("y", -8).attr("fill", "rgba(255,255,255,0.7)").style("font-size", "11px").text("Menos horas");
        gLeyenda.append("text").attr("x", 180).attr("y", -8).attr("text-anchor", "end").attr("fill", "rgba(255,255,255,0.7)").style("font-size", "11px").text("Más horas");
        gLeyenda.append("text").attr("x", 0).attr("y", 26).attr("fill", "#FBBF24").style("font-size", "11px").style("font-weight", "600").text(minHoras.toFixed(1) + " h");
        gLeyenda.append("text").attr("x", 180).attr("y", 26).attr("text-anchor", "end").attr("fill", "#818CF8").style("font-size", "11px").style("font-weight", "600").text(maxHoras.toFixed(1) + " h");
    }

    return { dibujar };
})();