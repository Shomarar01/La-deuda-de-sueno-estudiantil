
/**
 * ====================================================================
 * GRAFICA_RELOJ.JS - El Reloj Biológico Roto & Jetlag Social
 * Visualización Radial con Alta Visibilidad y Respuesta Interactiva
 * ====================================================================
 */

const graficaReloj = {
    dibujar: function(param1, param2, param3, param4) {
        let grupo, datos, ancho, alto;

        if (param1 && (param1.nodeType || param1.classed || param1.append)) {
            grupo = param1;
            datos = param2;
            ancho = param3 || 600;
            alto = param4 || 600;
        } else if (Array.isArray(param1)) {
            datos = param1;
            const container = d3.select("#lienzo-d3");
            container.html("");
            const rect = container.node() ? container.node().getBoundingClientRect() : { width: 600, height: 600 };
            ancho = rect.width || 600;
            alto = rect.height || 600;

            const svg = container.append("svg")
                .attr("width", ancho)
                .attr("height", alto)
                .attr("viewBox", `0 0 ${ancho} ${alto}`);

            grupo = svg.append("g");
        } else {
            console.error("Parámetros no válidos en graficaReloj.dibujar");
            return;
        }

        if (!datos || !Array.isArray(datos) || datos.length === 0) {
            d3.csv("datasetsProyecto/kaggle.csv").then(data => {
                this.renderizar(grupo, data, ancho, alto);
            }).catch(err => {
                console.error("Error al cargar datos para el reloj:", err);
            });
        } else {
            this.renderizar(grupo, datos, ancho, alto);
        }
    },

    renderizar: function(grupo, data, ancho, alto) {
        // 1. Limpieza total previa
        grupo.selectAll(".reloj-contenedor").remove();

        // 2. TAMAÑO AUMENTADO: Reducción drástica de márgenes para maximizar el reloj
        const margin = 22; // Margen optimizado para etiquetas externas
        const radius = (Math.min(ancho, alto) / 2) - margin;
        const centroX = ancho / 2;
        const centroY = alto / 2;

        const gReloj = grupo.append("g")
            .attr("class", "reloj-contenedor")
            .attr("transform", `translate(${centroX}, ${centroY})`);

        // Tooltip flotante global
        let tooltip = d3.select("body").select(".reloj-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "reloj-tooltip")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("background", "rgba(18, 20, 36, 0.96)")
                .style("color", "#FFFFFF")
                .style("padding", "10px 14px")
                .style("border-radius", "8px")
                .style("font-size", "12px")
                .style("font-family", "system-ui, -apple-system, sans-serif")
                .style("border", "1px solid rgba(255, 255, 255, 0.2)")
                .style("box-shadow", "0 8px 24px rgba(0,0,0,0.7)")
                .style("pointer-events", "none")
                .style("z-index", "2000")
                .style("line-height", "1.5");
        }

        // --- ESCALAS POLARES Y PROCESAMIENTO ---
        const angleScale = d3.scaleLinear().domain([0, 24]).range([0, 2 * Math.PI]);
        const radiusScale = d3.scaleLinear().domain([2, 10]).range([30, radius]);

        const parsedData = (data || []).map((d, index) => {
            const id = String(d.id || d.Student_ID || (index + 1));
            const sleepDuration = parseFloat(d.Sleep_Duration) || 6;

            const parseHour = (val) => {
                let h = parseFloat(val);
                return isNaN(h) ? 0 : (h % 24 + 24) % 24;
            };

            const weekdayStart = parseHour(d.Weekday_Sleep_Start);
            const weekendStart = parseHour(d.Weekend_Sleep_Start);

            let diff = Math.abs(weekendStart - weekdayStart);
            if (diff > 12) diff = 24 - diff;

            const r = radiusScale(sleepDuration);
            const aWeek = angleScale(weekdayStart);
            const aEnd = angleScale(weekendStart);

            return {
                id: id,
                sleepDuration: sleepDuration,
                weekdayStart: weekdayStart,
                weekendStart: weekendStart,
                jetlag: diff.toFixed(1),
                x1: r * Math.sin(aWeek),
                y1: -r * Math.cos(aWeek),
                x2: r * Math.sin(aEnd),
                y2: -r * Math.cos(aEnd)
            };
        });

        // --- A. ZONA SALUDABLE DE FONDO (10 PM - 12 AM) ---
        const healthyArc = d3.arc()
            .innerRadius(15)
            .outerRadius(radius + 5)
            .startAngle(angleScale(22))
            .endAngle(angleScale(24));

        gReloj.append("path")
            .attr("d", healthyArc)
            .attr("fill", "rgba(78, 205, 196, 0.12)")
            .attr("stroke", "rgba(78, 205, 196, 0.3)")
            .attr("stroke-dasharray", "3,3");

        // Etiqueta Zona Saludable en posición libre de colisiones
        const healthyAngle = angleScale(23);
        const healthyR = radiusScale(8.2);
        gReloj.append("text")
            .attr("x", healthyR * Math.sin(healthyAngle) - 15)
            .attr("y", -healthyR * Math.cos(healthyAngle))
            .attr("text-anchor", "middle")
            .attr("fill", "#4ECDC4")
            .style("font-size", "10px")
            .style("font-weight", "600")
            .text("Zona Saludable (10PM - 12AM)");

        // --- B. ANILLOS GUÍA Y HORAS ---
        const guideHours = [4, 6, 8, 10];
        const guidesGroup = gReloj.append("g").attr("class", "reloj-guias");

        guideHours.forEach(h => {
            const r = radiusScale(h);
            guidesGroup.append("circle")
                .attr("r", r)
                .attr("fill", "none")
                .attr("stroke", "rgba(255, 255, 255, 0.12)")
                .attr("stroke-dasharray", "2,4");

            guidesGroup.append("text")
                .attr("x", 4)
                .attr("y", -r + 11)
                .attr("fill", "rgba(255, 255, 255, 0.45)")
                .style("font-size", "9px")
                .text(`${h}h sueño`);
        });

        // --- C. EJES Y ETIQUETAS PRINCIPALES ---
        const clockHours = [
            { hour: 0, label: "Media noche" },
            { hour: 6, label: "6 AM" },
            { hour: 12, label: "Medio día" },
            { hour: 18, label: "6 PM" }
        ];

        clockHours.forEach(item => {
            const angle = angleScale(item.hour);
            const labelR = radius + 15;
            const x = labelR * Math.sin(angle);
            const y = -labelR * Math.cos(angle);

            gReloj.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (radius + 4) * Math.sin(angle))
                .attr("y2", -(radius + 4) * Math.cos(angle))
                .attr("stroke", "rgba(255, 255, 255, 0.15)")
                .attr("stroke-dasharray", "2,2");

            gReloj.append("text")
                .attr("x", x)
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("fill", "rgba(255, 255, 255, 0.85)")
                .style("font-size", "11px")
                .style("font-weight", "600")
                .text(item.label);
        });

        // --- D. LÍNEAS / ESTELAS (OPACIDAD CORREGIDA EN ESTADO INICIAL) ---
        const estelasGroup = gReloj.append("g").attr("class", "estelas");
        
        estelasGroup.selectAll(".estela")
            .data(parsedData)
            .enter()
            .append("line")
            .attr("class", d => `estela estudiante-${d.id}`)
            .attr("x1", d => d.x1)
            .attr("y1", d => d.y1)
            .attr("x2", d => d.x2)
            .attr("y2", d => d.y2)
            .attr("stroke", "#FF7043")
            .attr("stroke-width", 0.9)
            .attr("stroke-opacity", 0.12); // Visibilidad equilibrada en reposo

        // --- E. INTERACTIVIDAD Y RESTAURACIÓN INMEDIATA ---
        const formatHour = (decimalHour) => {
            let h = Math.floor(decimalHour);
            let m = Math.round((decimalHour - h) * 60);
            if (m === 60) { h = (h + 1) % 24; m = 0; }
            const ampm = h >= 12 ? "PM" : "AM";
            let displayH = h % 12 || 12;
            const displayM = m < 10 ? `0${m}` : m;
            return `${displayH}:${displayM} ${ampm}`;
        };

        // Función para restaurar el estado original (Efecto desaparece al quitar el cursor)
        const restaurarEstadoOriginal = () => {
            gReloj.selectAll(".estela")
                .style("stroke-opacity", 0.12)
                .style("stroke-width", 0.9)
                .style("stroke", "#FF7043");

            gReloj.selectAll("circle.punto-semana")
                .style("opacity", 0.75)
                .style("fill", "#73BBA3")
                .style("stroke", "none")
                .attr("r", 4);

            gReloj.selectAll("circle.punto-finde")
                .style("opacity", 0.7)
                .style("fill", "#FF7043")
                .style("stroke", "none")
                .attr("r", 3);

            tooltip.style("visibility", "hidden").style("opacity", 0);
        };

        const handleMouseOver = (event, d) => {
            // Atenuar elementos del fondo
            gReloj.selectAll(".estela").style("stroke-opacity", 0.03);
            gReloj.selectAll("circle.nodo").style("opacity", 0.15);

            // Destacar estudiante activo
            const activeElements = gReloj.selectAll(`.estudiante-${d.id}`);

            activeElements.filter(".estela")
                .style("stroke-opacity", 1)
                .style("stroke-width", 2.8)
                .style("stroke", "#FF5722")
                .raise();

            activeElements.filter(".punto-semana")
                .style("opacity", 1)
                .style("fill", "#73BBA3")
                .attr("r", 6.5)
                .style("stroke", "#FFFFFF")
                .style("stroke-width", 1.5)
                .raise();

            activeElements.filter(".punto-finde")
                .style("opacity", 1)
                .style("fill", "#FF5722")
                .attr("r", 5.5)
                .style("stroke", "#FFFFFF")
                .style("stroke-width", 1.2)
                .raise();

            tooltip.style("visibility", "visible").style("opacity", 1)
                .html(`
                    <div style="font-weight: bold; font-size: 13px; color: #73BBA3; margin-bottom: 4px;">Estudiante #${d.id}</div>
                    <div><strong>Entre semana:</strong> ${formatHour(d.weekdayStart)}</div>
                    <div><strong>Fin de semana:</strong> ${formatHour(d.weekendStart)}</div>
                    <div><strong>Horas de sueño:</strong> ${d.sleepDuration} hrs</div>
                    <div style="margin-top: 5px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.15); color: #FF7043; font-weight: bold;">
                        Desfase (Jetlag): ${d.jetlag} hrs
                    </div>
                `);
        };

        const handleMouseMove = (event) => {
            tooltip
                .style("top", (event.pageY - 15) + "px")
                .style("left", (event.pageX + 18) + "px");
        };

        // --- F. NODOS Y PUNTOS (PUNTOS SOLIDOS Y CLAROS) ---
        const nodesGroup = gReloj.append("g").attr("class", "nodos");

        // Puntos Entre Semana (Verdes bien visibles)
        nodesGroup.selectAll(".punto-semana")
            .data(parsedData)
            .enter()
            .append("circle")
            .attr("class", d => `nodo punto-semana estudiante-${d.id}`)
            .attr("cx", d => d.x1)
            .attr("cy", d => d.y1)
            .attr("r", 4)
            .attr("fill", "#73BBA3")
            .style("opacity", 0.75) // Alta visibilidad sin necesidad de pasar el cursor
            .style("cursor", "pointer")
            .on("mouseover", handleMouseOver)
            .on("mousemove", handleMouseMove)
            .on("mouseout", restaurarEstadoOriginal);

        // Puntos Fin de Semana (Naranjas bien visibles)
        nodesGroup.selectAll(".punto-finde")
            .data(parsedData)
            .enter()
            .append("circle")
            .attr("class", d => `nodo punto-finde estudiante-${d.id}`)
            .attr("cx", d => d.x2)
            .attr("cy", d => d.y2)
            .attr("r", 3)
            .attr("fill", "#FF7043")
            .style("opacity", 0.7) // Alta visibilidad
            .style("cursor", "pointer")
            .on("mouseover", handleMouseOver)
            .on("mousemove", handleMouseMove)
            .on("mouseout", restaurarEstadoOriginal);

        // Limpieza de seguridad si el cursor sale completamente del contenedor del reloj
        gReloj.on("mouseleave", restaurarEstadoOriginal);
    }
};