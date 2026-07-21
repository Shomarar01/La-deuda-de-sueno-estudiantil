# 💤 La Deuda de Sueño: Hábitos y Calificaciones Universitarias

Este repositorio contiene el proyecto final para el sexto trimestre de la licenciatura en Tecnologías y Sistemas de Información en la UAM Cuajimalpa. Es una experiencia de *scrollytelling* y visualización de datos interactiva que explora la crisis de sueño en la comunidad universitaria.

## 📊 Sobre el proyecto

A menudo se glorifica el desvelo como una señal de compromiso académico. Este proyecto desmiente ese mito utilizando tres conjuntos de datos reales para demostrar cómo la falta de descanso destruye el ciclo circadiano y, en consecuencia, el rendimiento escolar.

El flujo narrativo guía al usuario a través de cinco visualizaciones dinámicas que mantienen la "constancia de objetos" (los mismos nodos se transforman de una gráfica a otra para contar una historia continua). El recorrido finaliza con un **Simulador de Ritmo Circadiano**, una herramienta interactiva que predice el impacto académico basado en los propios horarios del usuario.

## 🛠️ Tecnologías utilizadas

- **D3.js (v7):** Motor principal para la manipulación del DOM, simulaciones físicas (force-directed graphs) y transiciones SVG.
- **Scrollama.js:** Librería para manejar la lógica del *scrollytelling* y disparar las animaciones de datos según la posición del usuario en la pantalla.
- **HTML5 & CSS3:** Arquitectura de interfaz moderna, diseño *borderless*, modo oscuro nativo y controles interactivos.
- **JavaScript (ES6):** Lógica del simulador predictivo y orquestación de datos.

## 📁 Fuentes de Datos

La narrativa se sustenta en la triangulación de tres datasets procesados e integrados para el proyecto:
1. **Student Sleep Patterns (Kaggle):** Análisis de deuda de sueño y Jetlag Social.
2. **Exploring Sleep Patterns and Academic Performance (CMU):** Correlación entre la variabilidad de horarios, siestas diurnas y el promedio general (GPA).
3. **Student Insomnia and Educational Outcomes (Mendeley Data):** Relación causal entre hábitos nocturnos (uso de pantallas/cafeína), calidad del sueño y fracaso académico.

## 🚀 Instalación y uso

Dado que es un proyecto puramente *frontend*, no requiere de un proceso de compilación complejo (sin Node.js ni bundlers).

1. Clona este repositorio:
   ```bash
   git clone [https://github.com/tu-usuario/deuda-de-sueno.git](https://github.com/tu-usuario/deuda-de-sueno.git)
