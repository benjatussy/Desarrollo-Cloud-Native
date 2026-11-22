---
title: Pipeline de eventos bancarios end-to-end con Kafka Streams
type: guia-de-laboratorio
asignatura: Desarrollo Cloud Native
nivel: intermedio
stack: [Docker Compose, Kafka 7.5.0, Spring Boot 3.x, Java 17, Maven 3.9+, Kafka Streams, Kafka UI]
fuente_base: "3.2.2 Pipeline de eventos del caso end-to-end" (Duoc UC, 2025)
---

# Guía autónoma de laboratorio: Pipeline de eventos bancarios end-to-end con Kafka Streams

> Material de apoyo docente. Se conserva el escenario, los nombres de topics y los umbrales de la fuente base. Las correcciones y ampliaciones se identifican expresamente.

## Resumen para agentes (TL;DR)

- **Flujo:** `API REST → productor Kafka → topic banco-transacciones → Kafka Streams (filtro + detección) → topic banco-alertas → Kafka UI`
- **Reglas de negocio:**
  - `monto <= 10` → se descarta (no se procesa).
  - `10 < monto <= 10000` → se procesa, **sin alerta**.
  - `monto > 10000` → se procesa y genera alerta con severidad `ALTA`.
- **Puertos:** Kafka `9092` (host), Spring Boot `8080`, Kafka UI `8081`.
- **Topics:** `banco-transacciones` (entrada), `banco-alertas` (salida), `banco-totales` (solo ampliación B).
- **Endpoint:** `POST http://localhost:8080/api/banco/transaccion`
- **Paquete base Java:** `com.banco`; artifact `banco-pipeline`.

### Casos de prueba esperados

| Monto | Consola de la aplicación | Topic `banco-alertas` |
|---|---|---|
| 5 | No aparece "Procesada" | Sin nueva alerta |
| 500 | `Procesada: 500.0` | Sin nueva alerta |
| 10000 | `Procesada: 10000.0` | Sin alerta (umbral estricto `>10000`) |
| 15000 | `Procesada: 15000.0` y `ALERTA` | Nuevo evento con severidad `ALTA` |

---

## Índice de extractos de código

| ID | Archivo / ubicación | Lenguaje | Propósito | Sección |
|---|---|---|---|---|
| C1 | `kafka-lab/docker-compose.yml` | yaml | Infraestructura: ZooKeeper, Kafka, Kafka UI | [4](#4-crear-infraestructura-kafka) |
| C2 | Terminal (`kafka-lab`) | bash | Validar y levantar Compose | [4](#4-crear-infraestructura-kafka) |
| C3 | Terminal (`kafka-lab`) | bash | Crear y listar topics | [5](#5-crear-topics-explícitamente) |
| C4 | `banco-pipeline/pom.xml` | xml | Dependencias Maven | [6](#6-crear-el-proyecto-spring-boot) |
| C5 | `src/main/resources/application.yml` | yaml | Configuración Spring Kafka/Streams | [6](#6-crear-el-proyecto-spring-boot) |
| C6 | `src/main/java/com/banco/BancoPipelineApplication.java` | java | Arranque y `@EnableKafkaStreams` | [7](#7-clases-java-y-rutas-de-archivo) |
| C7 | `.../model/Transaccion.java` | java | Evento de entrada | [7](#7-clases-java-y-rutas-de-archivo) |
| C8 | `.../model/AlertaFraude.java` | java | Evento de salida | [7](#7-clases-java-y-rutas-de-archivo) |
| C9 | `.../config/PipelineTopology.java` | java | Topología Kafka Streams | [8](#8-implementar-la-topología-de-procesamiento) |
| C10 | `.../controller/SimuladorController.java` | java | Endpoint REST productor | [9](#9-crear-endpoint-rest-para-simular-transacciones) |
| C11 | Terminal (`banco-pipeline`) | bash | Compilar y ejecutar | [10](#10-compilar-y-ejecutar) |
| C12 | PowerShell / CMD | bash/powershell | Pruebas con `curl.exe` | [11](#11-pruebas-end-to-end) |
| C13 | PowerShell | powershell | Prueba con `Invoke-RestMethod` | [11](#11-pruebas-end-to-end) |
| C14 | Ampliación B (`PipelineTopology`) | java | Agregación por usuario | [12](#12-ampliaciones-propuestas) |

---

## 1. Objetivo y resultado esperado

Construir un flujo: API REST → productor Kafka → topic `banco-transacciones` → Kafka Streams (filtrado y detección) → topic `banco-alertas` → Kafka UI.

- Transacciones de monto **5** se descartan.
- Transacciones de monto **500** se procesan sin alerta.
- Transacciones de monto **15000** generan una alerta **ALTA**.

| Componente | Responsabilidad |
|---|---|
| Docker Compose | Inicia broker Kafka y consola Kafka UI. |
| Spring Boot | Expone endpoint REST y publica mensajes. |
| Kafka Streams | Consume eventos, filtra, transforma y publica alertas. |
| Topics | `banco-transacciones` (entrada), `banco-alertas` (salida). |
| Kafka UI | Inspección visual de topics y mensajes. |

## 2. Conceptos fundamentales

| Término | Definición y función |
|---|---|
| Evento | Hecho ocurrido; aquí una transacción con usuario, monto, origen y timestamp. |
| Topic | Registro lógico de eventos en Kafka. |
| Producer / Consumer | Publica eventos / lee eventos desde Kafka. |
| Partición y key | La clave `usuario` permite que eventos de un mismo usuario vayan normalmente a la misma partición y conserven orden dentro de ella. |
| Pipeline end-to-end | Recorrido completo desde la entrada hasta la salida verificable. |
| KStream | Flujo de registros clave-valor sobre el que se aplican operaciones. |
| Serde | Serializador/deserializador para convertir objetos Java en bytes y viceversa. |
| `filter` / `mapValues` / `peek` / `to` | Seleccionar eventos / transformar valores / observar eventos / escribir en topic. |
| `application.id` | Identificador de la aplicación Kafka Streams; determina grupo de consumo y recursos internos. |

## 3. Prerrequisitos y dónde trabajar

| Herramienta | Verificación / uso |
|---|---|
| Docker Desktop + Compose | Terminal PowerShell o integrada: `docker --version` ; `docker compose version`. Docker debe estar iniciado. |
| JDK 17 o superior | `java -version`. Se usa Java 17 en este ejemplo. |
| Maven 3.9+ | `mvn -version`; alternativa: Maven Wrapper de un proyecto generado. |
| IDE (IntelliJ / VS Code) | Crear y editar archivos Java, `pom.xml` y `application.yml`. |
| Postman o curl | Enviar solicitudes HTTP POST. |
| Navegador | Kafka UI en `http://localhost:8081`. |

**Antes de comenzar:** comprobar que los puertos `9092`, `8080` y `8081` están libres. En Windows:

```powershell
netstat -ano | findstr :8080
```

Crear carpeta de trabajo (`kafka-lab`) y abrir allí una terminal.

## 4. Crear infraestructura Kafka

Carpeta: `kafka-lab`. Se conserva la base ZooKeeper/Kafka 7.5.0 de la guía, con listeners bien definidos y Kafka UI trasladada al puerto 8081. **Configuración solo para laboratorio local, no para producción.**

**[C1] `kafka-lab/docker-compose.yml`**

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:29092,PLAINTEXT_HOST://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8081:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
```

> Nota sobre listeners: `kafka:29092` es la dirección **interna** (entre contenedores, usada por Kafka UI y los comandos `docker compose exec`); `localhost:9092` es la dirección **externa** (usada por la app Spring Boot en el host).

**[C2] Comandos (terminal en `kafka-lab`)**

```bash
docker compose config        # Valida sintaxis y resuelve el YAML. Debe terminar sin errores.
docker compose up -d         # Descarga imágenes y arranca contenedores en segundo plano.
docker compose ps            # kafka y kafka-ui deben estar "Up".
docker compose logs -f kafka # Sigue los logs del broker; Ctrl+C deja de seguirlos.
```

Abrir `http://localhost:8081`. Si Kafka UI tarda, esperar a que el broker termine de iniciar.

## 5. Crear topics explícitamente

**[C3] Terminal en `kafka-lab`**

```bash
docker compose exec kafka kafka-topics --bootstrap-server kafka:29092 \
  --create --if-not-exists --topic banco-transacciones --partitions 3 \
  --replication-factor 1

docker compose exec kafka kafka-topics --bootstrap-server kafka:29092 \
  --create --if-not-exists --topic banco-alertas --partitions 3 \
  --replication-factor 1

docker compose exec kafka kafka-topics --bootstrap-server kafka:29092 --list
```

| Opción | Significado |
|---|---|
| `--bootstrap-server` | Señala el broker. |
| `--create` | Crea el topic. |
| `--if-not-exists` | Evita error si ya existe. |
| `--partitions 3` | Permite hasta tres tareas de consumo en paralelo. |
| `--replication-factor 1` | Adecuado solo para este broker de laboratorio. |

## 6. Crear el proyecto Spring Boot

En [start.spring.io](https://start.spring.io) crear proyecto con:

- Maven, Java 17, Spring Boot 3.x compatible
- Group: `com.banco`, Artifact: `banco-pipeline`
- Dependencias: **Spring Web** y **Spring for Apache Kafka**

Descomprimir y abrir en el IDE. Añadir Kafka Streams si no se incorporó. *La guía original incluye Lombok; aquí se evita para reducir problemas de configuración del IDE.*

**[C4] `pom.xml`** (dentro de `<dependencies>`; Spring Boot gestiona las versiones)

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.kafka</groupId>
  <artifactId>spring-kafka</artifactId>
</dependency>
<dependency>
  <groupId>org.apache.kafka</groupId>
  <artifactId>kafka-streams</artifactId>
</dependency>
```

**[C5] `src/main/resources/application.yml`**

```yaml
server:
  port: 8080
spring:
  kafka:
    bootstrap-servers: localhost:9092
    streams:
      application-id: banco-pipeline-app
      bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
```

> **Corrección respecto a la fuente original:** el archivo original usa la raíz `kafka:` en vez de `spring.kafka:`, lo que impide que Spring Boot aplique automáticamente las propiedades. También se configura explícitamente el serializador JSON del productor.

## 7. Clases Java y rutas de archivo

Crear las clases en `src/main/java/com/banco/`.

**[C6] `BancoPipelineApplication.java`** (arranque y activación de Kafka Streams)

```java
package com.banco;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafkaStreams;

@SpringBootApplication
@EnableKafkaStreams
public class BancoPipelineApplication {
    public static void main(String[] args) {
        SpringApplication.run(BancoPipelineApplication.class, args);
    }
}
```

**[C7] `model/Transaccion.java`** (evento de entrada)

```java
package com.banco.model;

public class Transaccion {
    private String usuario;
    private Double monto;
    private String origen;
    private Long timestamp;

    public Transaccion() {}

    public String getUsuario() { return usuario; }
    public void setUsuario(String v) { usuario = v; }
    public Double getMonto() { return monto; }
    public void setMonto(Double v) { monto = v; }
    public String getOrigen() { return origen; }
    public void setOrigen(String v) { origen = v; }
    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long v) { timestamp = v; }
}
```

**[C8] `model/AlertaFraude.java`** (evento de salida)

```java
package com.banco.model;

public class AlertaFraude {
    private String usuario;
    private Double monto;
    private String motivo;
    private String severidad;

    public AlertaFraude() {}

    public AlertaFraude(String u, Double m, String motivo, String s) {
        this.usuario = u;
        this.monto = m;
        this.motivo = motivo;
        this.severidad = s;
    }

    public String getUsuario() { return usuario; }
    public void setUsuario(String v) { usuario = v; }
    public Double getMonto() { return monto; }
    public void setMonto(Double v) { monto = v; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String v) { motivo = v; }
    public String getSeveridad() { return severidad; }
    public void setSeveridad(String v) { severidad = v; }
}
```

## 8. Implementar la topología de procesamiento

Archivo: `config/PipelineTopology.java`. Implementa el núcleo funcional: leer, filtrar, detectar, transformar y escribir. El enriquecimiento monetario y la agregación se explican aparte ([sección 12](#12-ampliaciones-propuestas)) porque no estaban implementados en el código fuente original.

**[C9] `config/PipelineTopology.java`**

```java
package com.banco.config;

import com.banco.model.Transaccion;
import com.banco.model.AlertaFraude;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.support.serializer.JsonSerde;

@Configuration
public class PipelineTopology {

    @Bean
    public KStream<String, Transaccion> kStreamPipeline(StreamsBuilder builder) {
        JsonSerde<Transaccion> txSerde = new JsonSerde<>(Transaccion.class);
        JsonSerde<AlertaFraude> alertSerde = new JsonSerde<>(AlertaFraude.class);

        KStream<String, Transaccion> entrada = builder.stream(
            "banco-transacciones", Consumed.with(Serdes.String(), txSerde));

        KStream<String, Transaccion> validas = entrada
            .filter((key, tx) -> tx != null && tx.getMonto() != null
                && tx.getMonto() > 10)
            .peek((key, tx) -> System.out.println("Procesada: " + tx.getMonto()));

        KStream<String, AlertaFraude> alertas = validas
            .filter((key, tx) -> tx.getMonto() > 10000)
            .mapValues(tx -> new AlertaFraude(tx.getUsuario(), tx.getMonto(),
                "Transaccion inusualmente alta en " + tx.getOrigen(), "ALTA"));

        alertas.peek((key, a) -> System.out.println("ALERTA: " + a.getMotivo()))
            .to("banco-alertas", Produced.with(Serdes.String(), alertSerde));

        return entrada;
    }
}
```

| Expresión Java | Interpretación didáctica |
|---|---|
| `builder.stream(...)` | Suscribe la aplicación al topic de entrada y deserializa cada mensaje. |
| `Consumed.with(...)` | Especifica cómo leer la clave `String` y el valor JSON `Transaccion`. |
| `filter(... > 10)` | Deja pasar montos mayores a 10; exactamente 10 queda fuera. |
| `peek(...)` | Registra un mensaje para observación; no altera el evento. |
| `filter(... > 10000)` | Identifica montos estrictamente superiores a 10000. |
| `mapValues(...)` | Convierte una `Transaccion` en una `AlertaFraude` conservando la clave. |
| `to(...)` | Publica la alerta serializada en `banco-alertas`. |
| `return entrada` | Devuelve la referencia al flujo de entrada; no equivale a publicar eventos. |

## 9. Crear endpoint REST para simular transacciones

Archivo: `controller/SimuladorController.java`. Recibe JSON y publica un evento con clave `usuario`. Incluye validación mínima (nulos y montos negativos).

**[C10] `controller/SimuladorController.java`**

```java
package com.banco.controller;

import com.banco.model.Transaccion;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/banco")
public class SimuladorController {

    private final KafkaTemplate<String, Transaccion> kafka;

    public SimuladorController(KafkaTemplate<String, Transaccion> kafka) {
        this.kafka = kafka;
    }

    @PostMapping("/transaccion")
    public ResponseEntity<String> enviar(@RequestBody Transaccion tx) {
        if (tx == null || tx.getUsuario() == null || tx.getUsuario().isBlank()
            || tx.getMonto() == null || tx.getMonto() < 0 || tx.getOrigen() == null) {
            return ResponseEntity.badRequest().body("Datos invalidos");
        }
        if (tx.getTimestamp() == null) tx.setTimestamp(System.currentTimeMillis());
        kafka.send("banco-transacciones", tx.getUsuario(), tx);
        return ResponseEntity.accepted().body("Transaccion recibida para envio");
    }
}
```

> **Nota:** HTTP `202 Accepted` indica aceptación de la solicitud para envío asíncrono; **no** confirma que Kafka Streams ya terminó de procesar. En producción se debe verificar el resultado futuro del envío, manejar errores y agregar observabilidad.

## 10. Compilar y ejecutar

**[C11] Terminal dentro de `banco-pipeline`**

```bash
mvn clean package        # Compila y empaqueta; comprobar BUILD SUCCESS.
mvn spring-boot:run      # Inicia servidor HTTP y Kafka Streams; mantener la terminal abierta.
```

Verificar broker y UI (desde la carpeta con el compose): `docker compose ps`.

Si Maven no se encuentra y el proyecto contiene Maven Wrapper (PowerShell):

```powershell
.\mvnw.cmd spring-boot:run
```

## 11. Pruebas end-to-end

Desde PowerShell o Postman. En PowerShell usar `curl.exe` (no el alias `curl`). En Postman: método `POST`, URL indicada, Body → raw → JSON.

**[C12] `curl.exe`** (cada comando en una sola línea)

```powershell
curl.exe -X POST http://localhost:8080/api/banco/transaccion -H "Content-Type: application/json" -d '{"usuario":"juan","monto":500,"origen":"app"}'

curl.exe -X POST http://localhost:8080/api/banco/transaccion -H "Content-Type: application/json" -d '{"usuario":"juan","monto":15000,"origen":"cajero"}'

curl.exe -X POST http://localhost:8080/api/banco/transaccion -H "Content-Type: application/json" -d '{"usuario":"juan","monto":5,"origen":"app"}'
```

> **Nota Windows:** el tratamiento de comillas JSON varía entre PowerShell y CMD. Si el terminal rechaza el cuerpo, usar Postman o `Invoke-RestMethod` con `ConvertTo-Json`.

**[C13] `Invoke-RestMethod`**

```powershell
$body = @{usuario='juan'; monto=15000; origen='cajero'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8080/api/banco/transaccion' `
  -Method Post -ContentType 'application/json' -Body $body
```

Resultados esperados: ver [tabla de casos de prueba](#casos-de-prueba-esperados).

**Verificación en Kafka UI:** `http://localhost:8081` → cluster `local` → Topics → `banco-alertas` → Messages. Comprobar `usuario`, `monto`, `motivo` y `severidad`. Si aparecen mensajes antiguos, distinguirlos por hora u operar con un grupo de pruebas nuevo.

## 12. Ampliaciones propuestas

Requisitos descritos en la fuente original pero ausentes en su código.

### A. Conversión monetaria simulada

La guía menciona "convertir moneda a USD", pero el modelo `Transaccion` no incluye moneda de origen ni tipo de cambio. Para implementarla:

1. Añadir un campo `moneda` a `Transaccion`.
2. Definir una regla explícita de conversión (ej. didáctico: CLP → USD dividiendo por una tasa fija de ejemplo).
3. Aplicar `mapValues` **antes** de comparar con un umbral definido en USD.

> No usar una tasa ficticia como tipo de cambio real.

### B. Agregación por usuario

La guía solicita el total gastado en tiempo real, pero su topología solo produce alertas. Se puede incorporar un flujo separado que agrupe por clave `usuario` y sume montos. Requiere un Serde de agregación, estado local y un topic de salida (ej. `banco-totales`).

**[C14] Idea didáctica: acumulación por usuario (añadir en `PipelineTopology`)**

```java
KTable<String, Double> totales = validas
    .groupByKey(Grouped.with(Serdes.String(), txSerde))
    .aggregate(() -> 0.0,
        (usuario, tx, acumulado) -> acumulado + tx.getMonto(),
        Materialized.with(Serdes.String(), Serdes.Double()));

totales.toStream().to("banco-totales",
    Produced.with(Serdes.String(), Serdes.Double()));
```

Para probarlo, crear previamente el topic `banco-totales` (mismo comando que en [C3]). Este ejemplo suma todas las transacciones aceptadas desde el estado disponible; **no** calcula ventana de tiempo. Si se exige "últimos cinco minutos", agregar `windowedBy` y diseñar las claves de salida.

## 13. Problemas frecuentes y soluciones

| Síntoma | Causa probable | Acción correctiva |
|---|---|---|
| `Port 8080 already in use` | Kafka UI y Spring Boot en el mismo puerto | Usar `8081:8080` en Kafka UI y `8080` para Spring Boot. |
| `Connection to node failed` | Kafka no inició o listeners incorrectos | `docker compose ps`; revisar logs y configuración de listeners. |
| `YAML parse error` | Indentación o tabulaciones | Usar espacios; `docker compose config`. |
| `BUILD FAILURE` | JDK, dependencias o archivos Java erróneos | `java -version`; `mvn -version`; revisar paquetes y nombres de clases. |
| `No qualifying bean StreamsBuilder` | Kafka Streams no habilitado | Añadir `@EnableKafkaStreams` y verificar dependencia `kafka-streams`. |
| `SerializationException` | Serde JSON o productor incorrecto | Verificar `JsonSerializer` en productor y `JsonSerde` en el stream. |
| HTTP 404 | Ruta o puerto incorrecto | Confirmar `/api/banco/transaccion` y puerto 8080. |
| HTTP 400 | JSON inválido o campos ausentes | Enviar `usuario`, `monto` numérico y `origen`. |
| Topic no aparece | Broker inaccesible o topic sin crear | Crear topics explícitamente; verificar `bootstrap-server`. |
| No se genera alerta | Monto no supera 10000 o mensaje filtrado | Probar monto 15000 y revisar logs de Streams. |
| Alerta duplicada en pruebas | Mensajes previos o relectura | Inspeccionar offsets; usar `application.id` nuevo solo en entorno de prueba. |

## 14. Evidencias que debe entregar el estudiante

| ID | Qué debe mostrar |
|---|---|
| E1 | Captura `docker compose ps` con Kafka y Kafka UI en ejecución. |
| E2 | Topics `banco-transacciones` y `banco-alertas` visibles en Kafka UI. |
| E3 | Estructura de proyecto Java, `application.yml` y `pom.xml`. |
| E4 | Código `PipelineTopology` con `filter`, `mapValues` y `to`. |
| E5 | Solicitud POST de monto 500 y registro de procesamiento sin alerta. |
| E6 | Solicitud POST de monto 15000, log `ALERTA` y mensaje JSON en `banco-alertas`. |
| E7 | Solicitud POST de monto 5 y ausencia de nueva alerta. |
| E8 | (Ampliación) Si se implementa: conversión simulada y acumulado por usuario en `banco-totales`. |

## 15. Lista de comprobación final

- [ ] Docker operativo
- [ ] Kafka UI accesible en 8081
- [ ] Topics creados
- [ ] Proyecto compila
- [ ] Aplicación escucha en 8080
- [ ] JSON llega al topic de entrada
- [ ] Filtro funciona
- [ ] Alerta se genera solo cuando monto > 10000
- [ ] Mensaje de salida es visible
- [ ] Capturas y breve interpretación adjuntas

## 16. Referencias y alcance

- Fuente base: "3.2.2 Pipeline de eventos del caso end-to-end", Duoc UC (2025). Los componentes, nombres y escenarios proceden de ese documento. Las correcciones de configuración, validación, uso de PowerShell, ejemplos de agregación y recomendaciones de diagnóstico son ampliaciones didácticas de esta guía.
- Kafka Streams: <https://kafka.apache.org/documentation/streams/>
- Spring for Apache Kafka: <https://docs.spring.io/spring-kafka/reference/>
- Docker Compose: <https://docs.docker.com/compose/>

> **Advertencia:** los ejemplos usan montos ficticios y una regla simplificada de sospecha; no constituyen un sistema bancario de detección de fraude listo para producción.
