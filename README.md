# Sistema de Soporte UMG — Servidor

API REST del sistema de gestión de tickets de soporte para estudiantes y catedráticos de la Universidad Mariano Gálvez. Construida con Express.js y conectada a Oracle XE local.

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
- **Base de datos:** Oracle XE (local)
- **Driver BD:** oracledb (oficial de Oracle)
- **Autenticación:** JWT (jsonwebtoken) + BCrypt (bcryptjs)
- **Variables de entorno:** dotenv

---

## Requisitos previos

- [Node.js 18+](https://nodejs.org/)
- [Oracle XE 21c](https://www.oracle.com/database/technologies/xe-downloads.html) instalado y corriendo localmente
- Git

---

## Guía de instalación

### 1. Clonar el repositorio y navegar al servidor

```bash
git clone https://github.com/serigio04/umg-proyecto-soporte.git
cd umg-proyecto-soporte/server
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo de variables de entorno

Este archivo **no está en el repositorio** por seguridad. Créalo manualmente en la raíz de la carpeta `server/`:

```env
PORT=3000
DB_USER=UMG_ANALISIS
DB_PASSWORD=tu_password
DB_CONNECTION=localhost:1521/XEPDB1
JWT_SECRET=una_clave_secreta_larga_y_segura
```

> **Importante:** Nunca subas el archivo `.env` al repositorio. Ya está incluido en el `.gitignore`.

> Si tu Oracle XE usa un service name diferente, cambia `XEPDB1` por `XE` o el que corresponda.

### 4. Crear el usuario semilla

Antes de correr el servidor por primera vez, crea un usuario de prueba en la BD:

```bash
node src/scripts/seedUsuario.js
```

Esto crea un estudiante con las siguientes credenciales:
- **Correo:** `sergio@miumg.edu.gt`
- **Contraseña:** `123456`

### 5. Correr el servidor

```bash
# Desarrollo (con reinicio automático)
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
server/
├── src/
│   ├── config/
│   │   └── db.js              # Conexión y pool de Oracle
│   ├── controllers/           # Reciben req/res, llaman a servicios
│   │   ├── auth.controller.js
│   │   └── ticket.controller.js
│   ├── services/              # Lógica de negocio y queries Oracle
│   │   └── ticket.service.js
│   ├── routes/                # Definición de endpoints
│   │   ├── auth.routes.js
│   │   └── ticket.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js # Verificación JWT y roles
│   ├── scripts/
│   │   └── seedUsuario.js     # Script para crear usuario de prueba
│   └── index.js               # Punto de entrada
├── .env                       # Variables de entorno (NO en el repo)
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
| POST | `/api/tickets` | Crear ticket | Estudiante |

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

> Oracle guarda los nombres de tabla y columna sensibles a mayúsculas porque EF Core los creó con comillas. Usa siempre comillas dobles en las queries: `SELECT * FROM "Usuarios"`.

---

## Problemas comunes

**`connectString` cannot be empty**
→ El archivo `.env` no se está leyendo correctamente. Verifica que esté en la raíz de la carpeta `server/` y que el servidor se corra desde esa misma carpeta.

**ORA-00942: la tabla o vista no existe**
→ Oracle es sensible a mayúsculas. Asegúrate de usar comillas dobles en todas las queries: `SELECT * FROM "Usuarios"` en lugar de `SELECT * FROM USUARIOS`.

**ORA-01017: invalid username/password**
→ Verifica que `DB_USER` y `DB_PASSWORD` en el `.env` coincidan exactamente con el usuario de Oracle. El usuario correcto es `UMG_ANALISIS`.

**Error de conexión al pool**
→ Verifica que el servicio de Oracle esté corriendo. En Windows busca `OracleServiceXE` en los servicios de Windows y asegúrate de que esté iniciado.

**Puerto 3000 en uso**
→ Cambia el valor de `PORT` en el `.env` o cierra el proceso que usa ese puerto con `npx kill-port 3000`.
