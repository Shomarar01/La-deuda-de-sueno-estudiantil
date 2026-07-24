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
        // Escala de color (Paleta personalizada)
        // ----------------------------
        const minHoras = d3.min(datos, d => d.hours);
        const maxHoras = d3.max(datos, d => d.hours);
        const puntoMedio = (minHoras + maxHoras) / 2;

        const escalaColor = d3.scaleLinear()
            .domain([minHoras, puntoMedio, maxHoras])
            .range(["#FBBF24", "#A855F7", "#818CF8"]);

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
                    return "#2A2F45"; // Gris-azul estético para países sin datos
                }
                return escalaColor(horas);
            })
            .attr("stroke", "rgba(255, 255, 255, 0.2)")
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) {
                const nombre = obtenerNombrePais(d);
                const horas = indice.get(nombre);

                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("stroke", "#FFFFFF")
                    .attr("stroke-width", 1.8);

                tooltip
                    .style("visibility", "visible")
                    .style("opacity", 1);

                if (horas == null) {
                    tooltip.html(`
                        <strong style="color: #94A3B8;">${nombre}</strong><br>
                        Sin información disponible
                    `);
                    return;
                }

                const deficit = (8 - horas).toFixed(1);

                tooltip.html(`
                    <strong style="color: #818CF8; font-size: 13px;">${nombre}</strong>
                    <hr style="margin:6px 0; border:0; border-top:1px solid rgba(255,255,255,0.15);">
                    Horas promedio: <b>${horas.toFixed(1)} h</b><br>
                    <span style="color: #FBBF24; font-weight: bold;">Déficit respecto a 8 h: ${deficit} h</span>
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
                    .attr("stroke", "rgba(255, 255, 255, 0.2)")
                    .attr("stroke-width", 0.5);

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
            .attr("stop-color", "#FBBF24");

        gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", "#A855F7");

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#818CF8");

        const gLeyenda = gMapa.append("g")
            .attr("class", "leyenda-mapa")
            .attr("transform", `translate(${ancho - 240},${alto - 70})`);

        gLeyenda.append("rect")
            .attr("width", 180)
            .attr("height", 12)
            .attr("fill", "url(#gradiente-sueno)")
            .attr("rx", 6);

        gLeyenda.append("text")
            .attr("x", 0)
            .attr("y", -8)
            .attr("fill", "rgba(255, 255, 255, 0.7)")
            .style("font-size", "11px")
            .text("Menos horas");

        gLeyenda.append("text")
            .attr("x", 180)
            .attr("y", -8)
            .attr("text-anchor", "end")
            .attr("fill", "rgba(255, 255, 255, 0.7)")
            .style("font-size", "11px")
            .text("Más horas");

        gLeyenda.append("text")
            .attr("x", 0)
            .attr("y", 26)
            .attr("fill", "#FBBF24")
            .style("font-size", "11px")
            .style("font-weight", "600")
            .text(minHoras.toFixed(1) + " h");

        gLeyenda.append("text")
            .attr("x", 180)
            .attr("y", 26)
            .attr("text-anchor", "end")
            .attr("fill", "#818CF8")
            .style("font-size", "11px")
            .style("font-weight", "600")
            .text(maxHoras.toFixed(1) + " h");
    }

    return {
        dibujar
    };

})();