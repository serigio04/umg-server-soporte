# Sistema de Soporte UMG — Servidor

API REST del sistema de gestión de tickets de soporte para estudiantes y catedráticos de la Universidad Mariano Gálvez. Construida con Express.js y conectada a PostgreSQL (compatible con Neon u otro proveedor PostgreSQL).

---

## Equipo

| Nombre | Carné |
|---|---|
| Sergio Alejandro Gomar Barrios | 9989-23-11043 |
| Claudia Azucena de León Noriega | 9989-22-14431 |
| Angie Dayana Jacinto Soyos | 9989-23-9752 |
| Fabiola Sarahí Hipólito Muralles | 9989-23-11491 |

---

## Tecnologías

- **Runtime:** Node.js
- **Framework:** Express.js
- **Base de datos:** PostgreSQL (Neon o local)
- **Driver BD:** `pg` (node-postgres)
- **Autenticación:** JWT (`jsonwebtoken`) + BCrypt (`bcryptjs`)
- **Variables de entorno:** `dotenv`

---

## Requisitos previos

- [Node.js 18+](https://nodejs.org/)
- Un servicio PostgreSQL accesible (puede ser local, Docker o Neon)
- Git

---

## Guía de instalación

### 1. Clonar el repositorio y navegar al servidor

```bash
git clone https://github.com/serigio04/umg-server-soporte
cd umg-server-soporte
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo de variables de entorno

Este archivo **no está en el repositorio** por seguridad. Créalo manualmente en la raíz del proyecto (misma carpeta que `package.json`):

```env
PORT=3000
# Cadena de conexión PostgreSQL completa. Ejemplos:
# Local: postgres://usuario:password@localhost:5432/nombre_basedatos
# Neon / URL: postgres://<user>:<pass>@<host>/<db>
DB_CONNECTION=postgres://UMG_ANALISIS:tu_password@localhost:5432/umgdb
JWT_SECRET=una_clave_secreta_larga_y_segura
```

> ⚠️ **Importante:** Nunca subas el archivo `.env` al repositorio. Ya está incluido en el `.gitignore`.

### 4. Correr los scripts semilla

Antes de correr el servidor por primera vez en **LOCAL**, ejecuta los scripts en este orden (desde la raíz del proyecto), en linea no es necesario:

```bash
# 1. Estudiantes
node src/scripts/seedEstudiantes.js

# 2. Agentes adicionales (solicitudes y cambios)
node src/scripts/seedAgentes.js

# 3. Coordinador
node src/scripts/seedCoordinador.js
```

### Usuarios de prueba

| Rol | Correo | Contraseña | Detalle |
|---|---|---|---|
| Estudiante 1 | `sgomar@miumg.edu.gt` | `123456` | Sergio Gomar — Ingeniería en Sistemas |
| Estudiante 2 | `fhipolito@miumg.edu.gt` | `123456` | Fabiola Hipolito — Ingeniería en Sistemas |
| Estudiante 3 | `cdeleon@miumg.edu.gt` | `123456` | Claudia de Leon — Ingeniería en Sistemas |
| Estudiante 4 | `ajacinto@miumg.edu.gt` | `123456` | Angie Jacinto — Ingeniería en Sistemas |
| Agente | `incidentes@miumg.edu.gt` | `123456` | Especialidad: Incidente |
| Agente | `solicitudes@miumg.edu.gt` | `123456` | Especialidad: Solicitud |
| Agente | `cambios@miumg.edu.gt` | `123456` | Especialidad: Cambio |
| Coordinador | `coordinador@miumg.edu.gt` | `123456` | NivelAcceso: 3 — puede crear usuarios |

> ⚠️ Estos usuarios son solo para desarrollo y pruebas. Nunca uses estas credenciales en producción.


### 5. Correr el servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`.

### 6. Verificar que funciona

```bash
curl http://localhost:3000/api/health
```

Deberías recibir:
```json
{ "status": "ok", "message": "Servidor corriendo" }
```

---

## Estructura del proyecto

```
.
├── src/
│   ├── config/
│   │   └── db.js                  # Conexión y pool (pg) — usa DB_CONNECTION
│   ├── controllers/               # Reciben req/res, llaman a servicios
│   │   ├── auth.controller.js
│   │   ├── ticket.controller.js
│   │   └── agente.controller.js
│   ├── services/                  # Lógica de negocio y consultas PostgreSQL
│   │   ├── auth.service.js
│   │   ├── ticket.service.js
│   │   └── agente.service.js
│   ├── routes/                    # Definición de endpoints
│   │   ├── auth.route.js
│   │   ├── ticket.route.js
│   │   └── agente.route.js
│   ├── middlewares/
│   │   └── auth.middleware.js     # Verificación JWT y roles
│   ├── scripts/
│   │   ├── seedUsuario.js
│   │   ├── seedAgente.js
│   │   ├── seedAgentes.js
│   │   └── seedCoordinador.js
│   └── index.js                   # Punto de entrada
├── .env                           # Variables de entorno (NO en el repo)
└── package.json
```

---

## Endpoints disponibles

### Auth
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión | No |

### Tickets
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/tickets` | Crear ticket (asigna agente automáticamente) | Estudiante |
| GET | `/api/tickets` | Obtener mis tickets | Estudiante |
| GET | `/api/tickets/ultimo` | Obtener último ticket abierto | Estudiante |

### Agentes
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | `/api/agentes/perfil` | Obtener perfil del agente autenticado | Agente, Coordinador |
| GET | `/api/agentes/:idAgente/tickets` | Obtener tickets asignados al agente | Agente, Coordinador |
| GET | `/api/agentes/:idAgente/ticket-prioridad` | Obtener ticket de mayor prioridad abierto | Agente, Coordinador |

---

## Tablas Oracle utilizadas

| Tabla | Descripción |
|---|---|
| `Usuarios` | Base de autenticación con roles |
| `Estudiantes` | Perfil del estudiante con carné y carrera |
| `AgenteSoporte` | Agente con especialidad y sede |
| `Tickets` | Solicitud/incidencia con SLA |
| `EstadosTicket` | Historial de cambios de estado del ticket |
| `BasesConocimiento` | Repositorio de artículos de ayuda |
| `Articulos` | Artículo individual de autogestión |

---

## ⚠️ Problemas comunes y comprobaciones

- **Cadena de conexión inválida / error de conexión:** Verifica que `DB_CONNECTION` en `.env` esté bien formada y que la base de datos PostgreSQL esté accesible.
- **Tablas faltantes / errores en queries:** Revisa que las migraciones o scripts de creación de tablas se hayan ejecutado antes de correr los seeds.
- **Puerto 3000 en uso:** Cambia el valor de `PORT` en el `.env` o cierra el proceso que usa ese puerto con `npx kill-port 3000`.

Si necesitas que adapte el proyecto para usarse con Oracle en lugar de PostgreSQL, avísame y lo documentamos o añadimos una rama/archivo de configuración separado.