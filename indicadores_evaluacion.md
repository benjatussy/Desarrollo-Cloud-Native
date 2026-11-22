# Rúbrica de Evaluación (Nivel: Muy Buen Desempeño - 100%)

A continuación se detallan los criterios exactos exigidos para obtener el **100% de logro** en cada uno de los indicadores de la **Evaluación Parcial N° 5**:

---

### 1. Configuración del Cliente Kafka (Ponderación: 12%)
* **Indicador:** El código del microservicio incluye la configuración completa del cliente Kafka, con conexión a los brokers levantados en Docker Compose y propiedades que permiten publicar y consumir mensajes desde los tópicos con sus particiones y réplicas definidas.
* **Criterio 100%:** La configuración del cliente Kafka está completa y correctamente definida incluyendo `bootstrap-servers`, `serializers`, `consumer groups` y propiedades avanzadas. Permite publicar y consumir mensajes desde ambos tópicos sin cambios adicionales.

---

### 2. Interacción con Tópicos y DTOs (Ponderación: 12%)
* **Indicador:** El código declara productores y consumidores que interactúan con los dos tópicos configurados, utilizando estructuras tipadas como DTO y validando que los microservicios puedan escribir y leer mensajes de manera coherente con la arquitectura Kafka del proyecto.
* **Criterio 100%:** Productores y consumidores están completamente implementados usando DTO estructurados y lógica clara. Interactúan correctamente con ambos tópicos siguiendo la arquitectura definida.

---

### 3. Microservicio Administrador - Operaciones Básicas (Ponderación: 6%)
* **Indicador:** El código del microservicio administrador incluye endpoints o clases que permiten crear, listar o mantener componentes de Kafka como tópicos y configuraciones básicas, demostrando capacidad de gestión sobre la plataforma de streaming.
* **Criterio 100%:** El microservicio administrador implementa operaciones completas para crear, listar y administrar tópicos y configuraciones básicas funcionando como una capa de gestión sólida.

---

### 4. Productores Kafka (Ponderación: 14%)
* **Indicador:** El código de los microservicios contiene productores Kafka correctamente implementados, enviando eventos a los tópicos configurados con uso de DTO bien estructurados y serializers adecuados para los tipos de datos manejados.
* **Criterio 100%:** Los productores están correctamente implementados con DTO claros, `serializers` adecuados y lógica alineada al diseño del sistema.

---

### 5. Consumidores Kafka y Separación de Lógica (Ponderación: 14%)
* **Indicador:** El código implementa consumidores Kafka que procesan eventos de forma coherente con los flujos de negocio, utilizando `@KafkaListener` u otra API equivalente y manteniendo la lógica de procesamiento separada de la infraestructura de mensajería.
* **Criterio 100%:** Los consumidores están completamente implementados usando `@KafkaListener` o equivalente y procesan los eventos respetando los flujos de negocio con clara separación entre lógica de dominio y mensajería.

---

### 6. Manejo de Errores y Resiliencia en Eventos (Ponderación: 12%)
* **Indicador:** El código demuestra manejo adecuado de errores durante el procesamiento de eventos, utilizando estrategias como logging, validación de payloads o control de reintentos que aseguran que los mensajes defectuosos o inesperados no interrumpan el funcionamiento del sistema.
* **Criterio 100%:** El manejo de errores está completamente implementado incluyendo validaciones, *logging* contextual y control de reintentos evitando efectos adversos en el sistema.

---

### 7. Parámetros de Administración de Tópicos (Ponderación: 12%)
* **Indicador:** El código o archivos de configuración contienen parámetros de administración de tópicos tales como niveles de retención, *cleanup policy*, número de particiones y factor de replicación ajustados a los requerimientos de los distintos flujos de datos.
* **Criterio 100%:** Los parámetros de administración están correctamente configurados y alineados con los requerimientos de cada flujo de datos.

---

### 8. Configuración y Uso de Consumer Groups (Ponderación: 12%)
* **Indicador:** El código demuestra la configuración y uso de *consumer groups* adecuados para balancear carga o asegurar procesamiento resiliente permitiendo que distintos microservicios compartan o dividan responsabilidades según el caso de uso.
* **Criterio 100%:** Los *consumer groups* están correctamente configurados y permiten balanceo, resiliencia y distribución según las necesidades del sistema.

---

### 9. Gestión Controlada y Replicable de Plataforma (Ponderación: 6%)
* **Indicador:** El código del microservicio administrador o scripts de infraestructura incluyen operaciones para crear, actualizar o inspeccionar tópicos y grupos de consumidores mostrando capacidad de gestionar la plataforma Kafka de manera controlada y replicable.
* **Criterio 100%:** El microservicio o scripts implementan operaciones completas y replicables para administrar tópicos y *consumer groups* demostrando dominio total sobre la gestión de Kafka.