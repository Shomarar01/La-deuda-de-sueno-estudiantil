const graficaMapa = (() => {

    // =====================================================
    // EQUIVALENCIAS ENTRE EL GEOJSON Y EL CSV
    // =====================================================
    const equivalencias = {
        "United States of America": "United States",
        "Russian Federation": "Russia",
        "Republic of Korea": "South Korea",
        "Korea, Republic of": "South Korea",
        "Czech Republic": "Czechia",
        "Viet Nam": "Vietnam",
        "United Republic of Tanzania": "Tanzania",
        "Syrian Arab Republic": "Syria",
        "Lao People's Democratic Republic": "Laos",
        "Iran (Islamic Republic of)": "Iran",
        "Moldova, Republic of": "Moldova",
        "Bolivia (Plurinational State of)": "Bolivia",
        "Venezuela (Bolivarian Republic of)": "Venezuela"
    };

    // =====================================================
    // CREA UN ÍNDICE PARA BUSCAR LAS HORAS DE SUEÑO
    // =====================================================
    function crearIndice(datos) {
        const indice = new Map();
        datos.forEach(d => {
            indice.set(d.country.trim(), d.hours);
        });
        return indice;
    }

    // =====================================================
    // OBTIENE EL NOMBRE CORRECTO DEL PAÍS
    // =====================================================
    function obtenerNombrePais(feature) {
        let nombre = feature.properties.name;
        if (equivalencias[nombre]) {
            nombre = equivalencias[nombre];
        }
        return nombre;
    }

    // =====================================================
    // TOOLTIP
    // =====================================================
    function crearTooltip() {
        let tooltip = d3.select("body").select(".tooltip-mapa");

        if (tooltip.empty()) {
            tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip-mapa")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background", "#ffffff")
                .style("color", "#1E1B4B")
                .style("border", "1px solid #cccccc")
                .style("border-radius", "10px")
                .style("padding", "12px")
                .style("font-family", "sans-serif")
                .style("font-size", "13px")
                .style("box-shadow", "0 4px 10px rgba(0,0,0,.18)")
                .style("opacity", 0)
                .style("visibility", "hidden")
                .style("z-index", 2000);
        }
        return tooltip;
    }

    // =====================================================
    // DIBUJAR
    // =====================================================
    function dibujar(svg, geojson, datos, ancho, alto) {

        const mapaPrevio = svg.selectAll(".g-mapa");
        if (!mapaPrevio.empty()) {
            mapaPrevio.interrupt().transition().duration(250).attr("opacity", 0).remove();
        }

        const gMapa = svg.append("g")
            .attr("class", "g-mapa")
            .attr("transform", "translate(0, -50) scale(1)");

        // ----------------------------
        // Índice y Tooltip
        // ----------------------------
        const indice = crearIndice(datos);
        const tooltip = crearTooltip();

        // ----------------------------
        // Escala de color
        // ----------------------------
        const minHoras = d3.min(datos, d => d.hours);
        const maxHoras = d3.max(datos, d => d.hours);

        const escalaColor = d3.scaleSequential()
            .domain([minHoras, maxHoras])
            .interpolator(d3.interpolateRdYlGn);

        // ----------------------------
        // Proyección
        // ----------------------------
        const proyeccion = d3.geoNaturalEarth1()
            .fitExtent(
                [
                    [30, 30],
                    [ancho - 30, alto - 30]
                ],
                geojson
            );

        const path = d3.geoPath(proyeccion);

        // ----------------------------
        // Fade inicial
        // ----------------------------
        gMapa
            .attr("opacity", 0)
            .transition()
            .duration(900)
            .attr("opacity", 1);

        // ----------------------------
        // Países
        // ----------------------------
        gMapa.selectAll(".pais")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("class", "pais")
            .attr("d", path)
            .attr("fill", d => {
                const nombre = obtenerNombrePais(d);
                const horas = indice.get(nombre);
                if (horas == null) {
                    return "#d9d9d9";
                }
                return escalaColor(horas);
            })
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) {
                const nombre = obtenerNombrePais(d);
                const horas = indice.get(nombre);

                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("stroke", "#222")
                    .attr("stroke-width", 2);

                // CORRECCIÓN CLAVE: Activar visibility explícitamente junto con opacity
                tooltip
                    .style("visibility", "visible")
                    .style("opacity", 1);

                if (horas == null) {
                    tooltip.html(`
                        <strong>${nombre}</strong><br>
                        Sin información disponible
                    `);
                    return;
                }

                const deficit = (8 - horas).toFixed(1);

                tooltip.html(`
                    <strong>${nombre}</strong>
                    <hr style="margin:6px 0; border:0; border-top:1px solid #e2e8f0;">
                    Horas promedio: <b>${horas.toFixed(1)} h</b><br><br>
                    Déficit respecto a 8 h: <b>${deficit} h</b>
                `);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 18) + "px")
                    .style("top", (event.pageY - 25) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("stroke", "#ffffff")
                    .attr("stroke-width", 0.5);

                // CORRECCIÓN CLAVE: Ocultar con visibility y opacity en simultáneo
                tooltip
                    .style("visibility", "hidden")
                    .style("opacity", 0);
            });

        // =====================================================
        // LEYENDA
        // =====================================================
        let defs = svg.select("defs");
        if (defs.empty()) {
            defs = svg.append("defs");
        } else {
            defs.selectAll("*").remove();
        }

        const gradient = defs.append("linearGradient")
            .attr("id", "gradiente-sueno");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", escalaColor(minHoras));

        gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", escalaColor((minHoras + maxHoras) / 2));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", escalaColor(maxHoras));

        const gLeyenda = gMapa.append("g")
            .attr("class", "leyenda-mapa")
            .attr("transform", `translate(${ancho - 240},${alto - 70})`);

        gLeyenda.append("rect")
            .attr("width", 180)
            .attr("height", 14)
            .attr("fill", "url(#gradiente-sueno)")
            .attr("rx", 8);

        gLeyenda.append("text")
            .attr("x", 0)
            .attr("y", -8)
            .style("font-size", "11px")
            .text("Menos horas");

        gLeyenda.append("text")
            .attr("x", 180)
            .attr("y", -8)
            .attr("text-anchor", "end")
            .style("font-size", "11px")
            .text("Más horas");

        gLeyenda.append("text")
            .attr("x", 0)
            .attr("y", 30)
            .style("font-size", "11px")
            .text(minHoras.toFixed(1) + " h");

        gLeyenda.append("text")
            .attr("x", 180)
            .attr("y", 30)
            .attr("text-anchor", "end")
            .style("font-size", "11px")
            .text(maxHoras.toFixed(1) + " h");
    }

    return {
        dibujar
    };

})();