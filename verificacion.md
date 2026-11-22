# Plan adaptado y trazabilidad de evaluación Kafka

> Nota: el archivo se guardó originalmente con codificación Windows-1252 y mostraba caracteres corruptos en lectores UTF-8. La versión actual está normalizada a UTF-8.

## Producto y alcance

Este repositorio contiene una aplicación de listas de compras con servicios de usuarios, artículos y categorías, API Gateway y frontend React. La guía `Guia_Pipeline_Kafka_End_to_End.md` usa un laboratorio bancario; se conservan los objetivos técnicos (dos tópicos, productores/consumidores, procesamiento Kafka Streams, administración y evidencia end-to-end), pero el escenario será actividad de compras y métricas administrativas. No se usarán transacciones financieras, fraude ni umbrales bancarios.

**Supuesto de producto:** el dashboard administrativo necesita observar actividad agregada de compras. RabbitMQ seguirá atendiendo los flujos operacionales ya implementados. Kafka se añadirá para analítica asíncrona, sin duplicar ni reemplazar RabbitMQ por motivos académicos. Si el dashboard busca otra función, se ajusta el evento antes de implementarlo.

## Diagnóstico

- `user-service`, `item-service` y `category-service` ya publican y consumen eventos con RabbitMQ; existen eventos como `ItemCreatedEvent`, `ItemPurchasedEvent` y `CategoryDeletedEvent`.
- `docker-compose.yml` ya declara Kafka 4.4.0 en KRaft, con tres nodos, persistencia y Kafka UI 0.7.2. `docker compose config --quiet` terminó con código 0; los contenedores y el flujo no se han ejecutado/verificado.
- Aún faltan cliente Kafka en los microservicios, DTOs Kafka, dos tópicos de aplicación, procesamiento de negocio, grupos de consumidores y administración Kafka.

## Diseño objetivo

Flujo propuesto:

`item-service → shopping-activity-events → Kafka Streams (analítica) → shopping-activity-metrics → consumidor backend/read model → dashboard`

- **Entrada:** `shopping-activity-events`, con eventos tipados de compras y campos presentes en el dominio. Definir clave, identificador de evento, versión y fecha de ocurrencia.
- **Salida:** `shopping-activity-metrics`, con agregados que el dashboard pueda consultar, por ejemplo compras por período/categoría si los datos actuales lo permiten.
- Los clientes incluirán solo los datos necesarios; preferir identificadores y métricas agregadas y excluir datos personales innecesarios.
- El grupo de Kafka Streams procesa el tópico de entrada; el backend de lectura consume el tópico de métricas con otro `group.id`. Productores/consumidores deben cubrir ambos tópicos en el flujo completo.
- Evaluar transactional outbox para evitar divergencia entre persistencia y publicación. Si queda fuera del alcance académico, documentar la garantía y la ventana de inconsistencia.

## Estándar y adaptación de tecnología

- Spring for Apache Kafka encaja con los servicios Spring actuales; Kafka Streams corresponde al procesamiento con estado/agregación de la guía. Usar versiones gestionadas por el Spring Boot del módulo elegido y comprobar compatibilidad antes de añadir dependencias.
- No actualizar todos los módulos ni crear microservicios por moda. Aislar la topología en un módulo/servicio de analítica para separar procesamiento del CRUD y la UI.
- La guía ejemplifica Kafka 7.5.0 con ZooKeeper; este repo usa Apache Kafka 4.4.0 con KRaft porque Kafka 4.x ya no soporta ZooKeeper. Mantener los tres nodos existentes para desarrollo local; no presentarlos como arquitectura de producción.

## Fases

Un check identifica implementación existente; no significa que el sistema completo se haya ejecutado.

### Fase 0 — Mensajería RabbitMQ existente

- [x] Productores y consumidores con eventos DTO en los servicios de usuarios, artículos y categorías.
- [x] Reintentos, DLQ y listeners que registran mensajes fallidos.
- [x] Administrador RabbitMQ para crear/eliminar colas y exchanges y crear/eliminar bindings.
- [x] Compose declara dos nodos RabbitMQ y `rabbitmq.conf` configura descubrimiento de pares.

### Fase 1 — Infraestructura Kafka local

- [x] Tres nodos Kafka en KRaft, volúmenes persistentes y replicación configurada para el clúster local.
- [x] Kafka UI conectada a los tres nodos.
- [x] Configuración Compose pasa validación sintáctica.
- [x] Arranque y conectividad comprobados: los tres brokers y Kafka UI están `Up`; quorum de tres votantes con líder y lag 0; puertos host `19092`, `29092`, `39092` y `8080` accesibles; Kafka UI responde HTTP 200 y registra métricas del clúster.

### Fase 2 — Configuración de cliente, contratos y productores

**Estado del check (2026-11-18): cerrada en alcance de fase 2.** Se completó la configuración del productor y se inspeccionó el entorno activo. Los servicios no se reiniciaron ni modificaron durante este check. La fase queda cerrada como implementación de cliente/contrato/productor; no equivale a aprobar los nueve indicadores globales, que requieren completar las fases 3–5.

- [x] Elegir y documentar el módulo backend: `DCNBackend-Mysql/item-service`, dueño de la acción de marcar un artículo como comprado. El evento Kafka se añade al flujo ya existente de RabbitMQ.
- [x] Documentar versiones declaradas: Java 25, Spring Boot 3.5.16 y Apache Kafka broker 4.4.0. `spring-kafka` no fija una versión manual y queda gestionado por el parent de Spring Boot. En ejecución se observó Java `jdk-25.0.5+8` en `item-service` y la imagen `apache/kafka:4.4.0`.
- [x] Crear el DTO versionable de actividad y definir serialización JSON y clave. `ShoppingActivityEvent` contiene `eventId`, `schemaVersion`, `eventType`, `occurredAt`, `itemId` y `userId`, con validaciones en el constructor; `KafkaTemplate` usa serialización JSON y la clave es `userId`. El DTO de métricas y el segundo tópico pertenecen a fase 3 y no bloquean este cierre.
- [x] Configurar la conexión de productor con `bootstrap-servers` externalizado, serializers String/JSON, `acks=all`, idempotencia, cinco reintentos con backoff de un segundo, timeout de solicitud/entrega, máximo de solicitudes en vuelo y cabecera de tipo JSON desactivada. Consumidores y grupos se implementan y verifican en fases 3–5; no se declara cubierto el indicador global de cliente hasta entonces.
- [x] Conectar la compra al productor de `item-service`: solo al cambiar de no comprado a comprado, conservando el evento operacional RabbitMQ. El productor confirma éxito o registra fallo con tópico, partición/offset cuando hay éxito e identificador de evento.

**Evidencia del entorno activo (lectura, sin cambios):**

- `docker compose ps`: los tres brokers Kafka, Kafka UI e `item-service` estaban `Up` al momento de la consulta.
- `kafka-metadata-quorum.sh ... describe --status`: líder `1`, tres votantes actuales y `MaxFollowerLag: 0`.
- `kafka-topics.sh ... --list`: existe `shopping-activity-events`.
- El contenedor `item-service` declara `SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka-1:9092,kafka-2:9092,kafka-3:9092`; su imagen corre Java 25. No tiene override `APP_KAFKA_TOPICS_SHOPPING_ACTIVITY_EVENTS`, por lo que el código usa el default `shopping-activity-events`.
- `http://localhost:8082/actuator/health` devolvió HTTP 401; la salud de la aplicación no pudo verificarse mediante ese endpoint sin autenticación.
- Los logs recientes de `item-service` muestran errores repetidos `UnknownHostException: rabbitmq-1` en consumidores RabbitMQ. Esto indica un problema de resolución de red entre contenedores del estado actual y puede afectar los flujos Rabbit preexistentes; requiere revisar la conexión/red del servicio antes de aceptar la integración completa.
- El comando para listar tópicos devolvió solo `shopping-activity-events`; no existe aún evidencia del tópico `shopping-activity-metrics`, esperado en fases posteriores.

**Actualización tras reconstrucción del servicio:** el usuario ejecutó `docker compose up -d --build --no-deps item-service`. Se confirmó que la imagen se reconstruyó y el contenedor quedó `Up`. La descripción del tópico muestra 3 particiones, factor de réplica 3, `min.insync.replicas=2`, `cleanup.policy=delete` y retención de 604800000 ms (7 días); las tres réplicas están en ISR en cada partición. Esto confirma configuración runtime del broker/tópico y estado del contenedor. No confirma por sí solo un envío del productor desde la API. Los logs recientes del servicio todavía reportan `UnknownHostException: rabbitmq-1` en consumidores RabbitMQ.

**Garantía y limitación conocida:** los reintentos configurados aplican a reintentos del cliente productor dentro del timeout de entrega; no hacen atómica la escritura MySQL y Kafka. Si el proceso cae entre guardar el cambio y enviar el evento, puede haber divergencia. Para una garantía transaccional se requiere implementar un transactional outbox; se deja para una decisión/etapa posterior y se explicita para no presentar idempotencia Kafka como garantía entre sistemas.

**Cierre funcional:** código y configuración de fase 2 están definidos, pero no se generó un evento de compra controlado desde la API en esta sesión. No se marca como verificada la publicación runtime porque Actuator exige autenticación y no se proporcionó una sesión/token para invocar el endpoint de negocio. El tópico sí existe y el broker respondió en las consultas de administración. Los errores de DNS RabbitMQ permanecen como incidencia de entorno y deben corregirse antes de aceptar el flujo operacional completo.

**Relación con `indicadores_evaluacion.md`:** esta fase aporta a los indicadores 1, 2, 4 y 6, pero no los cierra globalmente. Los indicadores 3, 5, 7, 8 y 9 siguen pendientes de las fases 3–5: procesamiento/consumidores, administrador, parámetros completos por tópico, grupos y scripts/operaciones replicables. Por tanto, solo se cierra la fase 2 del plan, no la evaluación Kafka completa.

### Fase 3 — Consumidores y procesamiento Kafka Streams

**Estado de implementación (2026-11-18): código agregado; pendiente de build/arranque y verificación runtime.** Se creó un servicio de analítica independiente y se añadió a Compose; los contenedores no se han reconstruido ni arrancado en esta sesión.

- [x] Implementar el procesamiento en `DCNBackend-Mysql/analytics-service`, separado de CRUD y UI; se usa Spring Kafka Streams, opción estándar soportada por Spring Boot/Spring Kafka para administrar el ciclo de vida de la topología ([documentación de Streams](https://docs.spring.io/spring-kafka/reference/streams.html), [configuración Spring Boot](https://docs.spring.io/spring-boot/reference/messaging/kafka.html)).
- [x] Consumir `shopping-activity-events` con `application.id=shopping-activity-streams-v1`; validar contrato/version 1, tipo de evento e IDs antes de agregar compras por ventana horaria basada en `occurredAt`. Ventanas de 1 hora, 10 minutos de tolerancia tardía, shards deterministas (16) y retención de estado de 7 días.
- [x] Publicar DTO JSON `ShoppingActivityMetric` a `shopping-activity-metrics`, clave `epochMillis|shard`; el servicio declara/provisiona los tópicos de salida y DLT con 3 particiones, RF 3, ISR mínimo 2 y retención 7 días.
- [x] Implementar consumidor de métricas en `analytics-service` con `group.id=shopping-activity-read-model-v1`, separado del `application.id` de Streams. Persiste por upsert idempotente en `analytics_db.hourly_shopping_metrics`, por shard y ventana.
- [x] Enrutar eventos inválidos a `shopping-activity-events-dlt`; el consumidor del read model aplica dos reintentos con backoff de 1 segundo y luego publica en `shopping-activity-metrics-dlt`. Los logs de consumo incluyen topic, partición y offset.
- [ ] Validar build, arranque del nuevo contenedor, creación de topics/grupos y recorrido real de compra a fila de read model. Estas verificaciones quedan pendientes hasta ejecutar el comando indicado al final.

**Supuestos y límites:** se cuenta actividad agregada por hora, no por categoría porque el evento actual no tiene `categoryId`. Se usa clave por shard para repartir cómputo; el read model debe sumar los shards para entregar el total por hora. Eventos con más de 10 minutos de atraso quedan fuera de la ventana admitida. La política de publicación MySQL→Kafka del productor de fase 2 sigue sin transactional outbox.

### Fase 4 — Administrador de tópicos y grupos

**Estado de implementación (2026-11-18): código agregado; pendiente build/arranque y verificación runtime.** Se añadieron endpoints en `analytics-service`; no se ejecutaron operaciones contra el clúster ni se reconstruyó el servicio.

- [x] Crear, listar, describir, actualizar configuración permitida y eliminar topics mediante `AdminClient`.
- [x] Crear topics con validación de nombre, máximo 24 particiones, RF entre 2 y los brokers disponibles, `min.insync.replicas=2`, retención entre 1 minuto y 90 días y cleanup policy `delete|compact`. Descripción muestra líder, réplicas, ISR y configuración efectiva.
- [x] Inspeccionar consumer groups `shopping-*`: estado, miembros, particiones asignadas, offsets confirmados, end offsets y lag. Eliminar solo grupos `EMPTY` o `DEAD` con confirmación exacta.
- [x] Proteger API: OAuth2 Resource Server con Azure AD. Lecturas requieren `SCOPE_Kafka.Read`; mutaciones requieren `SCOPE_Kafka.Admin`. Topics limitados al namespace `shopping-activity-*`/`shopping-analytics-*`; no se expone acceso directo al broker desde el navegador.
- [ ] Verificar token real con ambos scopes y operaciones en Kafka tras arrancar `analytics-service`.

**Límites deliberados:** el endpoint de configuración solo permite actualizar `retention.ms` y `cleanup.policy`. No permite reducir particiones (Kafka no lo soporta) ni cambiar factor de réplica por una modificación simple; una reasignación controlada de réplicas queda fuera de esta fase. Crear/eliminar topic requiere `SCOPE_Kafka.Admin` y body de confirmación exacta `DELETE:<topic>`; topics internos de Kafka Streams se excluyen y los topics con consumidores activos no se borran. Eliminar grupos requiere `DELETE:<groupId>` y estado inactivo; el `application.id` de Streams está protegido contra borrado directo. La app registration de Azure debe exponer/conceder `Kafka.Read` y `Kafka.Admin`; sin esos scopes, el servicio niega las operaciones.

Endpoints implementados:

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/kafka/topics` | `Kafka.Read` |
| GET | `/api/kafka/topics/{topic}` | `Kafka.Read` |
| POST | `/api/kafka/topics` | `Kafka.Admin` |
| PUT | `/api/kafka/topics/{topic}/config` | `Kafka.Admin` |
| DELETE | `/api/kafka/topics/{topic}` | `Kafka.Admin` + confirmación |
| GET | `/api/kafka/consumer-groups` | `Kafka.Read` |
| GET | `/api/kafka/consumer-groups/{groupId}` | `Kafka.Read` |
| DELETE | `/api/kafka/consumer-groups/{groupId}` | `Kafka.Admin` + grupo inactivo + confirmación |

Las operaciones usan la API `AdminClient` de Kafka para describir topics, alterar configs incrementalmente y consultar/eliminar grupos; Spring Kafka documenta `KafkaAdmin`/`AdminClient` como la vía para operaciones de administración avanzadas ([gestión de topics](https://docs.spring.io/spring-kafka/reference/kafka/configuring-topics.html), [API Admin de Kafka 4.4](https://kafka.apache.org/44/javadoc/org/apache/kafka/clients/admin/Admin.html)). Las versiones Java siguen gestionadas por Spring Boot, no fijadas al número del broker.

### Fase 5 — Dashboard y evidencia reproducible

- [ ] Exponer métricas al frontend mediante API/read model, no mediante conexión directa del navegador a Kafka.
- [ ] Verificar el recorrido de ambos tópicos: productor → tópico de entrada → Streams/group → tópico de salida → consumidor/group → API/dashboard.
- [ ] Reunir evidencia de grupos, offsets/lag, parámetros de tópicos, DTOs, manejo de errores y mensajes visibles en Kafka UI.
- [ ] Documentar comandos, puertos, configuración, recuperación y límites del entorno local.

## Trazabilidad con `indicadores_evaluacion.md`

| Indicador | Peso | Cómo lo cubre el plan |
|---|---:|---|
| 1. Configuración del cliente | 12% | Fases 2–3: bootstrap servers, serializers, grupos y opciones avanzadas; Fase 5 verifica conexión con los tópicos y sus particiones/réplicas. |
| 2. Tópicos y DTOs | 12% | Fases 2–3: DTOs tipados y lectura/escritura en `shopping-activity-events` y `shopping-activity-metrics`. |
| 3. Administrador, operaciones básicas | 6% | Fase 4: crear, listar/describir y administrar tópicos y configuración. |
| 4. Productores | 14% | Fases 2–3: productor de eventos de compra y productor de resultados Kafka Streams con serializers adecuados. |
| 5. Consumidores y separación | 14% | Fase 3: consumidor de entrada, topología separada del transporte y consumidor del tópico de métricas con API equivalente a `@KafkaListener`. |
| 6. Errores y resiliencia | 12% | Fases 2–3 y 5: validación, logs contextuales, reintentos, tratamiento/DLT y evidencia de recuperación. |
| 7. Parámetros de tópicos | 12% | Fase 4: particiones, réplicas, retención y cleanup policy alineados a cada flujo. |
| 8. Consumer groups | 12% | Fases 3–5: grupos por responsabilidad, balanceo, offsets/lag y verificación de comportamiento. |
| 9. Gestión replicable de plataforma | 6% | Fases 4–5: administración/scripts repetibles de tópicos y grupos, con límites y seguridad. |

**Evaluación del plan:** completar todas las fases actualizadas cubriría los nueve indicadores sin copiar el dominio bancario. Las fases 0–4 ya tienen implementación descrita, pero las fases 3–4 aún requieren build y evidencia runtime; faltan API/dashboard y recorrido end-to-end de fase 5. La calificación dependerá de que la entrega demuestre los criterios y de la aceptación del caso de uso adaptado por quien evalúa.

## Orden de ejecución

1. Completar arranque comprobable de infraestructura (Fase 1).
2. Fijar módulos/compatibilidad, contratos y parámetros de los dos tópicos (Fase 2).
3. Build/arranque del nuevo servicio y validar productores, Streams, consumidores y grupos (Fase 3).
4. Implementar administración segura de tópicos y grupos (Fase 4).
5. Integrar dashboard y recopilar evidencia de los nueve indicadores (Fase 5).

La fase 4 está implementada en código, pendiente de despliegue y comprobación runtime. La fase 5 (dashboard y evidencia end-to-end) sigue pendiente. La analítica propuesta es observabilidad agregada; no se usará para sancionar usuarios ni tomar decisiones de acceso.

## Aplicación de fase 3

Desde la raíz del repo, para construir y arrancar únicamente el nuevo servicio:

```powershell
docker compose up -d --build analytics-service
```

Después revisar `docker compose ps analytics-service`, logs del servicio y `shopping-activity-metrics`, `shopping-activity-events-dlt`, `shopping-activity-metrics-dlt`; verificar el consumer group `shopping-activity-read-model-v1` y consultar la tabla `analytics_db.hourly_shopping_metrics`. La fase 3 no se marcará como runtime verificada hasta observar ese recorrido.

Para comprobar la fase 4, obtener un access token Azure AD con scope `Kafka.Read` o `Kafka.Admin` y llamar `/api/kafka/topics` y `/api/kafka/consumer-groups`. No se marca como verificada hasta confirmar autorización y lectura de estado en el clúster activo.
