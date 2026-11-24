# Despliegue de Umbral

v0.1 corre en Docker: **Postgres + Next.js**, y la app escucha solo en loopback
(`127.0.0.1:3001`). Quien termina TLS es un reverse proxy — el que ya tengas o el
Caddy opcional de este compose.

## Qué queda expuesto

| Puerto | Servicio | Visible desde Internet |
|---|---|---|
| 80 / 443 | Caddy (si usas el perfil `tls`) | sí |
| 3001 | Umbral | **no** — solo loopback |
| 5432 | Postgres | **no** — red interna Docker |

## Camino A — Caddy propio (si 80/443 están libres)

```bash
# en el servidor
mkdir -p /opt/umbral && cd /opt/umbral
# copia el repo (git clone o scp)
cd deploy
cp env.example .env
nano .env                      # POSTGRES_PASSWORD, PUBLIC_URL, DOMAIN, ACME_EMAIL
chmod 600 .env
docker compose --profile tls up -d --build
```

Verifica:

```bash
curl -s https://TU_DOMINIO/api/health
```

Debe responder `{"status":"ok","db":"up",...}`.

## Camino B — reusar el Caddy que ya corre (recomendado en un VPS compartido)

Si el VPS ya tiene Caddy ocupando 80/443 (por ejemplo, para el MCP de HPOS):

1. Levanta solo la base de datos y la app:

```bash
cd deploy
cp env.example .env && nano .env   # APP_PORT=3001, PUBLIC_URL=https://umbral.tudominio.com
docker compose up -d --build
```

2. Añade un bloque al `Caddyfile` existente:

```caddy
umbral.tudominio.com {
	encode zstd gzip
	reverse_proxy host.docker.internal:3001
}
```

   Si el Caddy existente corre en otro contenedor y no resuelve
   `host.docker.internal`, hay dos salidas:

   - añadir `extra_hosts: ["host.docker.internal:host-gateway"]` al servicio de Caddy, o
   - conectar el contenedor `app` a la red del Caddy existente y usar
     `reverse_proxy <nombre-del-servicio>:3000`.

3. Recarga Caddy (`docker exec <caddy> caddy reload --config /etc/caddy/Caddyfile`).

## Sin dominio propio

Sirve igual: `PUBLIC_URL=https://umbral.IP-CON-GUIONES.sslip.io` y el mismo host
como `DOMAIN`. sslip.io resuelve y Let's Encrypt emite certificado real sin
configurar DNS. Es lo que ya usa el MCP.

## Operación

```bash
docker compose logs -f --tail=100 app
docker compose restart app
docker compose up -d --build            # actualizar código
docker compose down                     # bajar todo (conserva el volumen pgdata)
```

## Respaldos

```bash
docker compose exec -T db pg_dump -U umbral umbral | gzip > umbral-$(date +%F).sql.gz
```

Restaurar:

```bash
gunzip -c umbral-2026-11-23.sql.gz | docker compose exec -T db psql -U umbral -d umbral
```

Guarda esos dumps **fuera** del VPS. Un respaldo en el mismo disco no es respaldo.

## Advertencias de v0.1

- **No hay migraciones.** El contenedor aplica `prisma db push` al arrancar. Es
  seguro para crear y para cambios aditivos, pero no para cambios destructivos.
  Migrar a `prisma migrate deploy` es trabajo pendiente.
- **Sin verificación de correo ni recuperación de contraseña.** Si abres el
  registro al público, cualquiera puede crear cuentas.
- **Scores calculados en lectura.** Con pocos cientos de usuarios va sobrado; con
  miles hace falta caché.
- **El registro es abierto.** Para una prueba cerrada, pon una lista de espera o
  un proxy con HTTP Basic Auth delante.

## Checklist antes de invitar usuarios

- [ ] `PUBLIC_URL` es el dominio real (no localhost) — si no, los códigos de
      interacción que la gente comparte apuntan al vacío.
- [ ] `/api/health` responde `ok` por HTTPS.
- [ ] Respaldo programado y probado (restaura uno en una base temporal).
- [ ] Decidido si el registro es abierto o por invitación.
- [ ] `ETHICS.md` enlazado desde la landing (ya lo está).
