# Eventos internos con RabbitMQ

Los microservicios user-service, item-service y category-service publican y consumen eventos JSON por shopping.events. Los mensajes fallidos tras tres intentos se enrutan a la DLQ correspondiente en shopping.dlx. RabbitMQ es interno; el frontend continúa usando el api-gateway.

## Iniciar servicios

~~~
docker compose up -d --build
~~~

## Probar creación de usuario

El endpoint se conserva y se invoca a través del api-gateway:

~~~
curl -X POST http://localhost:8089/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"name":"Carlos Perez","email":"carlos@example.com","password":"miPassword123"}'
docker logs item-service
~~~

El gateway exige un token JWT válido para el API configurado en Azure Entra ID.

El evento user.created contiene únicamente userId, nunca la contraseña.

## Forzar un error y revisar la DLQ

La regla temporal de demostración hace fallar el consumidor de eventos de usuario cuando userId es 999. Para probarlo sin crear cientos de usuarios, abre la UI de RabbitMQ en http://localhost:15672, inicia sesión con admin / admin123 y publica en el exchange shopping.events:

- Routing key: user.created
- Payload: {"userId":999}
- Content type: application/json

Después de los tres intentos, el mensaje llega a items.user-events.dlq. En la UI abre Queues and Streams y selecciona esa cola; el DeadLetterListener de item-service también registra el body, x-death, cola de origen y routing key original en nivel ERROR:

~~~
docker logs item-service
~~~
