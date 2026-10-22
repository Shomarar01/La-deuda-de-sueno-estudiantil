SELECT 
    a.carrera,
    p.codigo_periodo,
    COUNT(r.id_respuesta) AS total_alumnos_evaluados,
    AVG(r.horas_sueno) AS promedio_horas_sueno,
    SUM(CASE WHEN r.nivel_riesgo = 'Crítico' THEN 1 ELSE 0 END) AS alumnos_en_riesgo_critico
FROM respuesta_cuestionario r
JOIN alumno a ON r.id_alumno = a.id_alumno
JOIN periodo_aplicacion p ON r.id_periodo = p.id_periodo
WHERE p.codigo_periodo = '26-I'
GROUP BY a.carrera, p.codigo_periodo;