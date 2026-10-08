// 1. Base de Datos Simulada Institucional
const datosUAM = {
    cuajimalpa: {
        nombre: "Unidad Cuajimalpa",
        divisiones: [
            { id: "CCD", nombre: "Ciencias de la Comunicación y Diseño", riesgo: "Alto", evaluados: 142 },
            { id: "CNI", nombre: "Ciencias Naturales e Ingeniería", riesgo: "Medio", evaluados: 98 },
            { id: "CSH", nombre: "Ciencias Sociales y Humanidades", riesgo: "Bajo", evaluados: 115 }
        ]
    },
    azcapotzalco: {
        nombre: "Unidad Azcapotzalco",
        divisiones: [
            { id: "CAD", nombre: "Ciencias y Artes para el Diseño", riesgo: "Alto", evaluados: 210 },
            { id: "CBI", nombre: "Ciencias Básicas e Ingeniería", riesgo: "Crítico", evaluados: 340 },
            { id: "CSH", nombre: "Ciencias Sociales y Humanidades", riesgo: "Medio", evaluados: 180 }
        ]
    },
    iztapalapa: {
        nombre: "Unidad Iztapalapa",
        divisiones: [
            { id: "CBI", nombre: "Ciencias Básicas e Ingeniería", riesgo: "Crítico", evaluados: 290 },
            { id: "CBS", nombre: "Ciencias Biológicas y de la Salud", riesgo: "Medio", evaluados: 250 },
            { id: "CSH", nombre: "Ciencias Sociales y Humanidades", riesgo: "Bajo", evaluados: 200 }
        ]
    },
    lerma: {
        nombre: "Unidad Lerma",
        divisiones: [
            { id: "CBI", nombre: "Ciencias Básicas e Ingeniería", riesgo: "Medio", evaluados: 60 },
            { id: "CBS", nombre: "Ciencias Biológicas y de la Salud", riesgo: "Bajo", evaluados: 85 },
            { id: "CSH", nombre: "Ciencias Sociales y Humanidades", riesgo: "Bajo", evaluados: 40 }
        ]
    },
    xochimilco: {
        nombre: "Unidad Xochimilco",
        divisiones: [
            { id: "CAD", nombre: "Ciencias y Artes para el Diseño", riesgo: "Alto", evaluados: 320 },
            { id: "CBS", nombre: "Ciencias Biológicas y de la Salud", riesgo: "Crítico", evaluados: 410 },
            { id: "CSH", nombre: "Ciencias Sociales y Humanidades", riesgo: "Alto", evaluados: 350 }
        ]
    }
};

// 2. Motor de Filtrado e Inyección de DOM 
function cargarUnidad(unidadKey, elementoBoton) {
    //  botón activo
    if(elementoBoton) {
        document.querySelectorAll('.btn-unidad').forEach(btn => btn.classList.remove('activo'));
        elementoBoton.classList.add('activo');
    }

    const contenedor = document.getElementById('contenedor-dinamico');
    const datos = datosUAM[unidadKey];

    // B) Construir el HTML dinámico
    let html = `<h2 class="titulo-unidad">Panorama: ${datos.nombre}</h2>
                <div class="grid-divisiones">`;

    datos.divisiones.forEach((div, index) => {
        const idImg = `img-${unidadKey}-${index}`;
        const idTxt = `txt-${unidadKey}-${index}`;
        const idBtn = `btn-${unidadKey}-${index}`;
        const idOver = `over-${unidadKey}-${index}`;

        html += `
            <div class="bloque-division">
                <h3>${div.id} - ${div.nombre}</h3>

                <div class="contenedor-visual" onmouseenter="revelarOverlay('${idOver}')" onmouseleave="ocultarOverlay('${idOver}')">
                    <!-- Gráfica simulada -->
                    <img id="${idImg}" class="box-imagen grafica-dinamica" src="https://via.placeholder.com/400x180/1E213A/818CF8?text=Métricas+${div.id}" alt="Gráfica ${div.id}">
                    <div id="${idOver}" class="overlay-texto">
                        <i class="fas fa-users"></i> ${div.evaluados} Evaluaciones Activas
                    </div>
                </div>

                <div id="${idTxt}" class="box-texto texto-dinamico">
                    <p class="dato-texto"><strong>Riesgo Institucional:</strong> ${div.riesgo}</p>
                    <p class="dato-texto"><strong>Impacto en Rendimiento:</strong> Correlación detectada entre fatiga e índices de reprobación.</p>
                </div>

                <button id="${idBtn}" class="btn-swap boton-dinamico" onclick="intercambiarVista('${idImg}', '${idTxt}', '${idBtn}')">
                    <i class="fas fa-exchange-alt"></i> Alternar Vista de Datos
                </button>
            </div>
        `;
    });

    html += `</div>`;
    contenedor.innerHTML = html;
}

// funciones de la práctica
function intercambiarVista(idImg, idTxt, idBtn) {
    const img = document.getElementById(idImg);
    const txt = document.getElementById(idTxt);
    const btn = document.getElementById(idBtn);

    if (img.style.display !== 'none') {
        img.style.display = 'none';
        txt.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-chart-bar"></i> Volver a Gráfica';
    } else {
        img.style.display = 'block';
        txt.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-exchange-alt"></i> Alternar Vista de Datos';
    }
}

function revelarOverlay(id) {
    document.getElementById(id).style.display = 'block';
}

function ocultarOverlay(id) {
    document.getElementById(id).style.display = 'none';
}

function cambiarModoGlobal(modo) {
    document.querySelectorAll('.btn-modo').forEach(btn => btn.classList.remove('activo'));
    event.currentTarget.classList.add('activo');

    const imagenes = document.getElementsByClassName('grafica-dinamica');
    const textos = document.getElementsByClassName('texto-dinamico');
    const botones = document.getElementsByClassName('boton-dinamico');

    for (let i = 0; i < imagenes.length; i++) {
        if (modo === 'solo-texto') {
            imagenes[i].style.display = 'none';
            textos[i].style.display = 'block';
            botones[i].style.display = 'none';
        } else {
            imagenes[i].style.display = 'block';
            textos[i].style.display = 'none';
            botones[i].style.display = 'block';
            botones[i].innerHTML = '<i class="fas fa-exchange-alt"></i> Alternar Vista de Datos';
        }
    }
}

// Salida y Carga Inicial
document.addEventListener('DOMContentLoaded', () => {
    // Cargar Cuajimalpa por defecto al abrir
    cargarUnidad('cuajimalpa', document.querySelector('.btn-unidad'));

    const btnSalir = document.getElementById("btnCerrarSesionGlobal");
    if (btnSalir) {
        btnSalir.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "../index.html";
        });
    }
});