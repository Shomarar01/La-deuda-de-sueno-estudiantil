const graficaReloj = {
    dibujar: function(grupo, data, ancho, alto) {
        grupo.selectAll(".reloj-contenedor").remove();

        const margin = 22;
        const radius = (Math.min(ancho, alto) / 2) - margin;
        const centroX = ancho / 2;
        const centroY = alto / 2;

        const gReloj = grupo.append("g").attr("class", "reloj-contenedor").attr("transform", `translate(${centroX}, ${centroY})`);

        let tooltip = d3.select("body").select(".reloj-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div").attr("class", "reloj-tooltip")
                .style("position", "absolute").style("visibility", "hidden")
                .style("background", "rgba(18, 20, 36, 0.96)").style("color", "#FFFFFF")
                .style("padding", "10px 14px").style("border-radius", "8px").style("font-size", "12px")
                .style("border", "1px solid rgba(255, 255, 255, 0.2)").style("box-shadow", "0 8px 24px rgba(0,0,0,0.7)")
                .style("pointer-events", "none").style("z-index", "2000").style("line-height", "1.5");
        }

        const angleScale = d3.scaleLinear().domain([0, 24]).range([0, 2 * Math.PI]);
        const radiusScale = d3.scaleLinear().domain([2, 10]).range([30, radius]);

        const parsedData = (data || []).map((d) => {
            const sleepDuration = parseFloat(d.Sleep_Duration) || 6;
            const parseHour = (val) => { let h = parseFloat(val); return isNaN(h) ? 0 : (h % 24 + 24) % 24; };

            const weekdayStart = parseHour(d.Weekday_Sleep_Start);
            const weekendStart = parseHour(d.Weekend_Sleep_Start);
            let diff = Math.abs(weekendStart - weekdayStart);
            if (diff > 12) diff = 24 - diff;

            const r = radiusScale(sleepDuration);
            const aWeek = angleScale(weekdayStart);
            const aEnd = angleScale(weekendStart);

            return {
                id: String(d.id), sleepDuration: sleepDuration, weekdayStart: weekdayStart, weekendStart: weekendStart, jetlag: diff.toFixed(1),
                x1: r * Math.sin(aWeek), y1: -r * Math.cos(aWeek), x2: r * Math.sin(aEnd), y2: -r * Math.cos(aEnd)
            };
        });

        // zona saludable
        const healthyArc = d3.arc().innerRadius(15).outerRadius(radius + 5).startAngle(angleScale(22)).endAngle(angleScale(24));
        gReloj.append("path").attr("d", healthyArc).attr("fill", "rgba(129, 140, 248, 0.12)").attr("stroke", "rgba(129, 140, 248, 0.3)").attr("stroke-dasharray", "3,3");
        
        const healthyAngle = angleScale(23);
        const healthyR = radiusScale(8.2);
        gReloj.append("text").attr("x", healthyR * Math.sin(healthyAngle) - 15).attr("y", -healthyR * Math.cos(healthyAngle)).attr("text-anchor", "middle").attr("fill", "#818CF8").style("font-size", "10px").style("font-weight", "600").text("Zona Saludable (10PM - 12AM)");

        // anillos guía
        const guidesGroup = gReloj.append("g").attr("class", "reloj-guias");
        [4, 6, 8, 10].forEach(h => {
            const r = radiusScale(h);
            guidesGroup.append("circle").attr("r", r).attr("fill", "none").attr("stroke", "rgba(255, 255, 255, 0.12)").attr("stroke-dasharray", "2,4");
            guidesGroup.append("text").attr("x", 4).attr("y", -r + 11).attr("fill", "rgba(255, 255, 255, 0.45)").style("font-size", "9px").text(`${h} HRS SUEÑO`);
        });

        const clockHours = [ { hour: 0, label: "Media noche" }, { hour: 6, label: "6 AM" }, { hour: 12, label: "Medio día" }, { hour: 18, label: "6 PM" } ];
        clockHours.forEach(item => {
            const angle = angleScale(item.hour);
            const labelR = radius + 15;
            gReloj.append("line").attr("x1", 0).attr("y1", 0).attr("x2", (radius + 4) * Math.sin(angle)).attr("y2", -(radius + 4) * Math.cos(angle)).attr("stroke", "rgba(255, 255, 255, 0.15)").attr("stroke-dasharray", "2,2");
            gReloj.append("text").attr("x", labelR * Math.sin(angle)).attr("y", -labelR * Math.cos(angle)).attr("text-anchor", "middle").attr("dominant-baseline", "central").attr("fill", "rgba(255, 255, 255, 0.85)").style("font-size", "11px").style("font-weight", "600").text(item.label);
        });

        grupo.selectAll(".estudiante").attr("opacity", 0).remove();

        const estelasGroup = gReloj.append("g").attr("class", "estelas");
        const lineas = estelasGroup.selectAll(".estela").data(parsedData).enter()
            .append("line").attr("class", d => `estela estudiante-${d.id}`)
            .attr("x1", d => d.x1).attr("y1", d => d.y1).attr("x2", d => d.x1).attr("y2", d => d.y1)
            .attr("stroke", "#FBBF24").attr("stroke-width", 0.9).attr("stroke-opacity", 0.12);

        lineas.transition().duration(800).delay(500).attr("x2", d => d.x2).attr("y2", d => d.y2);

        const formatHour = (decimalHour) => {
            let h = Math.floor(decimalHour); let m = Math.round((decimalHour - h) * 60);
            if (m === 60) { h = (h + 1) % 24; m = 0; }
            return `${h % 12 || 12}:${m < 10 ? `0${m}` : m} ${h >= 12 ? "PM" : "AM"}`;
        };

        const restaurar = () => {
            gReloj.selectAll(".estela").style("stroke-opacity", 0.12).style("stroke-width", 0.9).style("stroke", "#FBBF24");
            gReloj.selectAll("circle.punto-semana").style("opacity", 0.75).style("fill", "#818CF8").style("stroke", "none").attr("r", 4);
            gReloj.selectAll("circle.punto-finde").style("opacity", 0.7).style("fill", "#FBBF24").style("stroke", "none").attr("r", 3);
            tooltip.style("visibility", "hidden").style("opacity", 0);
        };

        const nodesGroup = gReloj.append("g").attr("class", "nodos");

        //  puntos nacen en extremos aleatorios fuera del centro (-centroX - 50 o ancho + 50) y vuelan a x1, y1
        nodesGroup.selectAll(".punto-semana").data(parsedData).enter().append("circle").attr("class", d => `nodo punto-semana estudiante-${d.id}`)
            .attr("cx", d => (Math.random() > 0.5 ? -centroX - 60 : centroX + 60)) //  extremos laterales
            .attr("cy", d => (Math.random() - 0.5) * alto) //  aleatoria inicial
            .attr("r", 4).attr("fill", "#818CF8").style("opacity", 0).style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                gReloj.selectAll(".estela").style("stroke-opacity", 0.03); gReloj.selectAll("circle.nodo").style("opacity", 0.15);
                const active = gReloj.selectAll(`.estudiante-${d.id}`);
                active.filter(".estela").style("stroke-opacity", 1).style("stroke-width", 2.8).style("stroke", "#FBBF24").raise();
                active.filter(".punto-semana").style("opacity", 1).style("fill", "#818CF8").attr("r", 6.5).style("stroke", "#FFFFFF").style("stroke-width", 1.5).raise();
                active.filter(".punto-finde").style("opacity", 1).style("fill", "#FBBF24").attr("r", 5.5).style("stroke", "#FFFFFF").style("stroke-width", 1.2).raise();
                tooltip.style("visibility", "visible").style("opacity", 1).html(`
                    <div style="font-weight: bold; font-size: 13px; color: #818CF8; margin-bottom: 4px;">Estudiante #${d.id}</div>
                    <div><strong>Entre semana:</strong> ${formatHour(d.weekdayStart)}</div><div><strong>Fin de semana:</strong> ${formatHour(d.weekendStart)}</div>
                    <div><strong>Horas de sueño:</strong> ${d.sleepDuration}</div>
                    <div style="margin-top: 5px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.15); color: #FBBF24; font-weight: bold;">Desfase (Jetlag): ${d.jetlag} hrs</div>
                `);
            }).on("mousemove", e => tooltip.style("top", (e.pageY - 15) + "px").style("left", (e.pageX + 18) + "px")).on("mouseout", restaurar)
            .transition().duration(1000).delay((d, i) => i * 3).style("opacity", 0.75).attr("cx", d => d.x1).attr("cy", d => d.y1);

        nodesGroup.selectAll(".punto-finde").data(parsedData).enter().append("circle").attr("class", d => `nodo punto-finde estudiante-${d.id}`)
            .attr("cx", d => d.x2).attr("cy", d => d.y2).attr("r", 0).attr("fill", "#FBBF24").style("opacity", 0.7).style("pointer-events", "none")
            .transition().duration(400).delay(1000).attr("r", 3);

        gReloj.on("mouseleave", restaurar);
    }
};