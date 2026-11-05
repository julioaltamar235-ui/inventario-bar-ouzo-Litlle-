export interface FichaSection {
  number: number;
  title: string;
  subtitle: string;
  summary: string;
  details: string[];
  keyTakeaway: string;
}

export const FICHA_FUNCIONAL_METADATA = {
  toolName: 'BarraExpress (Control Digital de Inventarios en Barra)',
  problem: 'Carga operativa insostenible de >30 conteos mensuales en papel y transcripción manual (22h de bartender, 10h de caja, 24h de administrador al mes), descuidando la experiencia del cliente y las propinas.',
  selectedInsight: 'Automatización de Captura en Barra — Plantilla digital táctil en smartphone para registrar existencias y niveles de botellas en 2 toques, eliminando el papeleo.',
  targetMetric: 'Reducir el tiempo de conteo del bar de 22 horas a MENOS DE 5 horas mensuales (ahorro superior al 75% del tiempo operativo del bartender).',
  businessType: 'Restaurante / Bar / Gastronomía de Alto Volumen',
};

export const FICHA_FUNCIONAL_SECTIONS: FichaSection[] = [
  {
    number: 1,
    title: 'Necesidad Exacta que Debe Resolver la Herramienta',
    subtitle: 'Erradicación del cuello de botella de captura y cotejo en barra',
    summary: 'Eliminar el registro físico en papel y la posterior transcripción manual de los conteos diarios de barra que consumen 1,320 minutos (22 horas) mensuales del bartender.',
    details: [
      'Eliminar las libretas y hojas sueltas de papel que se ensucian con líquidos en la barra y generan errores de lectura caligráfica.',
      'Estandarizar la medición de botellas abiertas mediante una interfaz visual táctil por décimos, evitando estimaciones subjetivas que falsean las existencias.',
      'Cotejar en tiempo real el stock físico contado contra el consumo teórico registrado por el punto de venta (POS), alertando discrepancias antes de que el turno termine.',
      'Liberar al personal de barra para que se enfoque en la hospitalidad, preparación rápida de cócteles y aumento de ventas/propinas.',
    ],
    keyTakeaway: 'Reemplazar 45 minutos de papeleo y transcripción por turno con 5 minutos de captura táctil directa en smartphone.',
  },
  {
    number: 2,
    title: 'Definición del Usuario Principal y Actores Clave',
    subtitle: 'El Bartender como operador central; Administrador y Cajero como beneficiarios',
    summary: 'El usuario primario es el Bartender (Líder o Encargado de Barra del turno), apoyado secundariamente por el Cajero y el Administrador.',
    details: [
      'Usuario Primario — Bartender / Barman de Cierre: Es quien está físicamente de pie en la barra frente a botelleros, neveras y speed rails. Necesita una herramienta 100% usable a una mano en smartphone, rápida, con botones táctiles grandes (>48px) y alto contraste para ambientes oscuros.',
      'Usuario Secundario 1 — Cajero: Recibe el acta digital para el cuadre diario de turno sin tener que interpretar números a lápiz ni esperar transcripciones demoradas.',
      'Usuario Secundario 2 — Administrador / Gerente de A&B: Supervisa el tablero de mermas consolidadas, ahorros de tiempo y discrepancias críticas sin pasar 24 horas al mes pasando datos a Excel.',
    ],
    keyTakeaway: 'Diseñada exclusivamente para la ergonomía y ritmo acelerado del Bartender al cerrar turno.',
  },
  {
    number: 3,
    title: 'Tarea del Usuario y Dificultad Actual',
    subtitle: 'De la libreta mojada con lápiz al registro digital instantáneo',
    summary: 'Contar 30 a 60 referencias de botellas abiertas y cerradas al final de la jornada bajo fatiga física y poca luz.',
    details: [
      'Tarea requerida: Inspeccionar el stock físico de botellas completas cerradas y estimar el volumen restante de botellas abiertas (ej. 3/4, media botella, 2 dedos) para cada destilado, vino y licor.',
      'Dificultad 1 (Estimación subjetiva): Cada bartender estima "a ojo" de forma distinta (uno anota 0.7, otro 0.5), distorsionando el costo real de alimentos y bebidas.',
      'Dificultad 2 (Doble digitación y desgaste): Primero anotan en papel, luego dictan al cajero o transcriben a una planilla de cálculo, sumando 22 horas mensuales solo en barra.',
      'Dificultad 3 (Fatiga y fricción): Al finalizar turnos agotadores de madrugada, el personal comete errores de cálculo que generan acusaciones injustas de faltantes o mermas.',
    ],
    keyTakeaway: 'Se transforma una tarea tediosa y propensa a error en un flujo táctil de menos de 10 segundos por botella.',
  },
  {
    number: 4,
    title: 'Formato Digital Más Apropiado',
    subtitle: 'Herramienta Operativa Mobile-First (Responsive Web App / PWA)',
    summary: 'Una aplicación web responsiva optimizada para pantalla de teléfono móvil táctil, con visualización de resumen en tablet/desktop.',
    details: [
      'Por qué NO un Dashboard tradicional: Un dashboard de analítica es para oficina y requiere ratón/teclado; el bartender está en el área de servicio rodeado de botellas.',
      'Por qué NO un simulador: Se requiere registrar datos de operación real con impacto directo en el inventario diario.',
      'Formato elegido: Herramienta Operativa Móvil Táctil (Touch-First PWA). Compatible con cualquier smartphone iOS o Android de los colaboradores, sin requerir descargas pesadas ni servidores complejos.',
      'Ergonomía de barra: Botones táctiles de gran tamaño, selector de nivel gráfico tipo botella que se llena con el pulgar, paleta oscura de alto contraste para barra nocturna.',
    ],
    keyTakeaway: 'Herramienta de bolsillo ultra liviana orientada a la acción con el pulgar en la barra física.',
  },
  {
    number: 5,
    title: 'Tres Funcionalidades Indispensables (Must-Haves V1)',
    subtitle: 'El núcleo de alta velocidad que garantiza reducir de 22h a <5h',
    summary: 'Las 3 capacidades mínimas no negociables para eliminar el papeleo y cotejar en tiempo real.',
    details: [
      '1. Captura Táctil Rápida por Niveles de Botella (Quick-Tap Stocking): Pantalla con catálogo ordenado por zonas de barra (Speed Rail, Botellero, Nevera). Entrada de botellas cerradas con +1/-1 y selector visual de décimos (0.1 a 0.9) para botellas abiertas en un solo toque.',
      '2. Motor de Cotejo Automático en Tiempo Real vs. Stock Teórico: Calcula al instante: Diferencia = Stock Contado - (Stock Inicial + Entradas - Ventas POS). Semáforo inmediato (Verde = OK, Amarillo = Variación leve de onzas, Rojo = Faltante crítico).',
      '3. Generador de Acta de Cierre Digital con Exportación a WhatsApp/CSV en 1 Toque: Consolida el informe del turno con duración del conteo, costo de discrepancias y copia el reporte listo para pegar en el chat del equipo o descargar para administración, sin transcripción manual.',
    ],
    keyTakeaway: 'Captura en 2 toques + Semáforo de diferencia en vivo + Acta compartible en 1 segundo.',
  },
  {
    number: 6,
    title: 'Datos que Deberá Ingresar o Consultar el Usuario',
    subtitle: 'Campos estrictamente necesarios sin sobrecarga administrativa',
    summary: 'Entradas mínimas por parte del bartender y consultas inmediatas calculadas por el sistema.',
    details: [
      'Datos que INGRESA el Bartender: Botellas cerradas (número entero positivo), Nivel visual de botella abierta (fracción de 0.0 a 0.9), Motivo rápido si hay diferencia (Menú desplegable: "Rotura accidental", "Cortesía gerencia", "Prueba de cata").',
      'Datos que CONSULTA el Bartender en pantalla: Nombre y tamaño de la botella, Ubicación en barra (Speed rail / Nevera), Stock teórico esperado del turno, Diferencia en unidades y semáforo de alerta, Cronómetro de tiempo transcurrido en el conteo.',
      'Datos que CONSULTA el Administrador / Caja: Resumen de cierre de turno, Horas ahorradas acumuladas en el mes (progreso hacia la meta < 5h), Costo financiero de las discrepancias detectadas.',
    ],
    keyTakeaway: 'Cero campos de texto libre obligatorios durante el servicio; todo por toques y selectores rápidos.',
  },
  {
    number: 7,
    title: 'Cálculos, Reglas y Acciones Necesarias',
    subtitle: 'Lógica matemática determinista y reglas operativas de barra',
    summary: 'Fórmulas de stock, reglas de tolerancia y semaforización automática de variaciones.',
    details: [
      'Fórmula 1 (Stock Físico Total): Stock_Fisico = Botellas_Cerradas + Nivel_Botella_Abierta (ej. 4 cerradas + 0.6 = 4.6 botellas).',
      'Fórmula 2 (Stock Teórico Esperado): Stock_Teorico = Stock_Inicial + Entradas_Bodega - Ventas_POS.',
      'Fórmula 3 (Diferencia / Discrepancia): Variacion = Stock_Fisico - Stock_Teorico. Si Variacion < 0 indica faltante; si > 0 indica sobrante.',
      'Fórmula 4 (Impacto Financiero): Costo_Variacion = Variacion × Costo_Unitario_Botella.',
      'Regla Operativa 1: Nivel de botella abierta restringido estrictamente entre 0.0 y 0.9. Un valor de 1.0 equivale a una botella cerrada.',
      'Regla Operativa 2 (Tolerancia de onzas): Diferencias entre -0.15 y +0.15 se consideran variación aceptable por goteo o sobre-vertido (Semáforo Amarillo). Faltantes > 0.20 botellas exigen justificación (Semáforo Rojo).',
      'Regla Operativa 3: Temporizador automático que mide los minutos reales del conteo para auditar el cumplimiento del KPI de reducción de tiempo.',
    ],
    keyTakeaway: 'Matemática transparente y automatizada que elimina 100% las sumas a mano y disputas de cálculo.',
  },
  {
    number: 8,
    title: 'Recorrido Principal del Usuario (Happy Path)',
    subtitle: 'Flujo cronológico de 5 pasos desde el inicio hasta el envío del reporte',
    summary: 'Paso a paso que recorre el bartender en menos de 5 minutos al terminar su turno.',
    details: [
      'Paso 1 (Inicio de Conteo): El bartender selecciona su nombre y turno (Cierre Noche) en su teléfono móvil y presiona "Iniciar Conteo Rápido". El cronómetro arranca.',
      'Paso 2 (Captura Táctil por Estación): El sistema presenta la lista agrupada por "Speed Rail" (las 8 botellas más usadas). El bartender toca las unidades cerradas y pulsa el nivel de la botella abierta en la silueta gráfica.',
      'Paso 3 (Revisión de Semáforo): Al avanzar por las categorías, el sistema pinta en verde las referencias exactas y en amarillo/rojo las discrepancias. Si detecta un faltante, el bartender añade en 2 clics la nota de "Rotura en servicio".',
      'Paso 4 (Finalización y Congelamiento): Presiona "Finalizar Conteo". El cronómetro se detiene y marca el tiempo récord (ej: 4m 32s vs 45m habituales).',
      'Paso 5 (Compartir y Archivar): Presiona "Copiar Reporte WhatsApp". Se copia el texto formateado al portapapeles y se envía al grupo de supervisión. La base local registra el conteo para la administración.',
    ],
    keyTakeaway: 'Flujo intuitivo y lineal sin menús complicados, completable en menos de 5 minutos.',
  },
  {
    number: 9,
    title: 'Resultado Observable que Debe Generar el Prototipo',
    subtitle: 'Evidencia tangible de éxito para evaluar el impacto en el restaurante',
    summary: 'Los dos artefactos visibles que demuestran que el problema está resuelto.',
    details: [
      '1. Acta Digital de Conteo de Barra (Consolidado Oficial): Formato estructurado con fecha, hora exacta, tiempo récord del conteo, listado de referencias con unidades contadas vs teóricas, costos de faltantes y firmas de cierre.',
      '2. Botón Funcional "Copiar Resumen WhatsApp": Genera un texto limpio con formato WhatsApp (*Negritas*, viñetas, totales) que el bartender puede enviar en 1 segundo a la gerencia.',
      '3. Tablero de Cumplimiento de KPI (22h → <5h): Medidor gráfico en vivo que calcula el tiempo mensual proyectado (ej. 4.1 horas/mes frente a las 22 horas base), demostrando con datos reales la consecución del objetivo del proyecto.',
    ],
    keyTakeaway: 'Un acta digital instantánea y una métrica comprobable de ahorro de 17.8 horas mensuales de bartender.',
  },
  {
    number: 10,
    title: 'Funcionalidades Excluidas de la Primera Versión (Out of Scope MVP)',
    subtitle: 'Límites claros para garantizar foco, ligereza y rápida puesta en marcha',
    summary: 'Elementos deliberadamente pospuestos para no retrasar la solución del cuello de botella crítico.',
    details: [
      'Excluido 1: Reconocimiento de botellas por visión artificial con la cámara del celular (evita problemas de iluminación tenue, reflejos y consumo excesivo de batería en el bar).',
      'Excluido 2: Integración bidireccional por API en vivo con ERPs o POS propietarios (se utiliza carga y descarga estándar de archivos o valores teóricos preconfigurados).',
      'Excluido 3: Módulo de compras, pagos a proveedores y facturación electrónica.',
      'Excluido 4: Pesaje por balanzas Bluetooth de ultra precisión (se mantiene la estimación visual táctil por décimos, suficiente para el 95% de la operación).',
      'Excluido 5: Autenticación biométrica o gestión de permisos multi-sucursal corporativos.',
    ],
    keyTakeaway: 'Foco exclusivo en la velocidad y precisión de captura del bartender en la barra.',
  },
];

export const DECISIONES_PENDIENTES = [
  {
    id: 'dec-1',
    topic: 'Frecuencia de Conteo Oficial',
    question: '¿El conteo rápido se ejecutará únicamente al cierre nocturno (30 conteos/mes) o en cada cambio de turno tarde/noche (60 conteos/mes)?',
    recommendation: 'Recomendación: Iniciar con conteo exclusivo al cierre nocturno para estabilizar la rutina sin saturar al equipo.',
  },
  {
    id: 'dec-2',
    topic: 'Tolerancia de Merma Aceptada (Over-pour)',
    question: '¿Cuál es el margen de variación porcentual permitido en cócteles antes de requerir reporte formal al administrador?',
    recommendation: 'Recomendación: Establecer ±0.15 botellas (aprox. 110 ml acumulados por turno en botellas de alta rotación) como margen operativo natural.',
  },
  {
    id: 'dec-3',
    topic: 'Catálogo de Conteo Focalizado vs. Exhaustivo',
    question: '¿Se deben contar las más de 60 referencias todos los días, o aplicar la regla 80/20 (conteo diario de las 15 botellas clave y semanal del resto)?',
    recommendation: 'Recomendación: Conteo diario de las 15 referencias de "Speed Rail" (llevando el tiempo a < 4 minutos) y conteo semanal del stock de reserva.',
  },
];
