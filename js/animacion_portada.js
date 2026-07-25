const animacionPortada = (function() {
    let svg, puntos, datosPuntos = [];
    const COLOR_AMBAR = "#FBBF24";
    const COLOR_LAVANDA = "#818CF8";

    function iniciar() {
        const contenedor = d3.select("#animacion-portada");
        if (contenedor.empty()) return;

        // Limpiar
        contenedor.selectAll("*").remove();
        datosPuntos = [];

        const ancho = window.innerWidth;
        const alto = window.innerHeight;

        svg = contenedor.append("svg").attr("width", ancho).attr("height", alto);

        //  80 puntos aleatorios
        for (let i = 0; i < 80; i++) {
            let x, y;
            //  evitamos el centro de la pantalla
            do {
                x = Math.random() * ancho;
                y = Math.random() * alto;
            } while (x > ancho * 0.15 && x < ancho * 0.85 && y > alto * 0.25 && y < alto * 0.75);

            // extremo de la pantalla van a nacer
            const borde = Math.floor(Math.random() * 4);
            let xInicio = x, yInicio = y;
            if (borde === 0) xInicio = -50; 
            else if (borde === 1) xInicio = ancho + 50; 
            else if (borde === 2) yInicio = -50; 
            else yInicio = alto + 50; 

            datosPuntos.push({
                x: x, y: y,
                xInit: xInicio, yInit: yInicio,
                color: Math.random() > 0.5 ? COLOR_AMBAR : COLOR_LAVANDA,
                r: Math.random() * 3 + 1.5 
            });
        }

        puntos = svg.selectAll("circle").data(datosPuntos).enter().append("circle")
            .attr("cx", d => d.xInit).attr("cy", d => d.yInit).attr("r", d => d.r)
            .attr("fill", d => d.color).attr("opacity", 0.6);

        entrar();
    }


    function vibrarIndividual(elemento) {
        d3.select(elemento)
            .transition()
            .duration(1000 + Math.random() * 1000)
            .ease(d3.easeSinInOut)
            .attr("cx", d => d.x + (Math.random() * 10 - 8)) // vibra entre -5px y 5px
            .attr("cy", d => d.y + (Math.random() * 10 - 8))
            .on("end", function() { vibrarIndividual(this); }); // Se vuelve a llamar a sí mismo
    }

    function entrar() {
        if (!puntos) return;
        puntos.interrupt()
            .transition().duration(2000).ease(d3.easeCubicOut)
            .attr("cx", d => d.x).attr("cy", d => d.y)
            .on("end", function() {
                // Al terminar de entrar, CADA PUNTO ejecuta su propia vibración
                vibrarIndividual(this); 
            }); 
    }

    function salir() {
        if (!puntos) return;
        puntos.interrupt()
            .transition().duration(800).ease(d3.easeCubicIn)
            .attr("cx", d => d.xInit).attr("cy", d => d.yInit); 
    }

    return { iniciar, entrar, salir };
})();