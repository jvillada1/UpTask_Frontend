# UpTask – Frontend

Aplicación web hecha con **React 19 + TypeScript + Vite** para gestionar proyectos.
Consume la API REST del backend (Express + MongoDB) mediante **Axios** y **TanStack Query**.

Este documento está pensado para aprender: explica cada pieza, por qué existe y cómo se conecta con las demás.

---

## Índice

1. [Tecnologías y para qué sirve cada una](#1-tecnologías-y-para-qué-sirve-cada-una)
2. [Cómo ejecutarlo](#2-cómo-ejecutarlo)
3. [Arquitectura y estructura de carpetas](#3-arquitectura-y-estructura-de-carpetas)
4. [Cómo se conecta cada archivo](#4-cómo-se-conecta-cada-archivo)
5. [Alias de rutas (`@/`)](#5-alias-de-rutas-)
6. [Punto de entrada: `main.tsx`](#6-punto-de-entrada-maintsx)
7. [Rutas con React Router DOM](#7-rutas-con-react-router-dom)
8. [Layout y `Outlet`](#8-layout-y-outlet)
9. [Conexión con el backend: Axios, API y CORS](#9-conexión-con-el-backend-axios-api-y-cors)
10. [Tipos y validación con Zod](#10-tipos-y-validación-con-zod)
11. [Views (páginas)](#11-views-páginas)
12. [Componentes](#12-componentes)
13. [Formularios con React Hook Form](#13-formularios-con-react-hook-form)
14. [Consultas (`useQuery`) y mutaciones (`useMutation`)](#14-consultas-usequery-y-mutaciones-usemutation)
15. [Invalidación de consultas: ¿por qué se hace?](#15-invalidación-de-consultas-por-qué-se-hace)
16. [Todos los hooks utilizados](#16-todos-los-hooks-utilizados)
17. [Flujos completos paso a paso](#17-flujos-completos-paso-a-paso)
18. [Estilos](#18-estilos)
19. [Problemas conocidos y mejoras](#19-problemas-conocidos-y-mejoras)
20. [Glosario](#20-glosario)

---

## 1. Tecnologías y para qué sirve cada una

| Paquete | Para qué se usa |
|---|---|
| **react / react-dom** | Librería para construir la interfaz con componentes |
| **typescript** | Tipado estático: detecta errores antes de ejecutar |
| **vite** | Servidor de desarrollo y empaquetador (muy rápido) |
| **react-router-dom** | Navegación entre "páginas" sin recargar el navegador |
| **axios** | Cliente HTTP para llamar a la API del backend |
| **@tanstack/react-query** | Maneja datos del servidor: caché, carga, errores, refetch y mutaciones |
| **@tanstack/react-query-devtools** | Panel visual para ver la caché de React Query en desarrollo |
| **react-hook-form** | Manejo de formularios y validación del lado del cliente |
| **zod** | Define esquemas para validar y tipar datos |
| **react-toastify** | Notificaciones emergentes (éxito / error) |
| **@headlessui/react** | Componentes accesibles sin estilos (menús desplegables, popovers) |
| **@heroicons/react** | Iconos SVG |
| **tailwindcss** (v4) | Estilos mediante clases utilitarias |

---

## 2. Cómo ejecutarlo

### Requisitos
- Node.js 18+
- El **backend corriendo** en `http://localhost:4000` (ver el README del backend)

### Variables de entorno

Archivo `.env.local` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:4000/api
```

- Vite solo expone al navegador las variables que empiezan con `VITE_`.
- Se leen con `import.meta.env.VITE_API_URL`.
- Si cambias el `.env.local` debes **reiniciar** `npm run dev`.

### Comandos

```bash
npm install
npm run dev       # servidor de desarrollo → http://localhost:5173
npm run build     # compila TypeScript y genera /dist para producción
npm run preview   # sirve el build generado
npm run lint      # ESLint
```

---

## 3. Arquitectura y estructura de carpetas

```
src/
├── main.tsx                      ← Punto de entrada, monta React y los "providers"
├── router.tsx                    ← Define las rutas de la aplicación
├── index.css                     ← Importa Tailwind
│
├── layouts/
│   └── AppLayout.tsx             ← Estructura común (header + contenido + toasts)
│
├── views/                        ← "Páginas": una por ruta
│   ├── DashboardView.tsx         ← Lista de proyectos
│   └── projects/
│       ├── CreateProjectView.tsx ← Crear proyecto
│       └── EditProjectView.tsx   ← Cargar datos y mostrar formulario de edición
│
├── components/                   ← Piezas reutilizables
│   ├── Logo.tsx
│   ├── NavMenu.tsx
│   ├── ErrorMessage.tsx
│   └── projects/
│       ├── ProjectForm.tsx       ← Campos del formulario (compartidos)
│       └── EditProjectForm.tsx   ← Formulario de edición completo
│
├── api/
│   └── ProjectAPI.ts             ← Funciones que llaman al backend
│
├── lib/
│   └── axios.ts                  ← Instancia configurada de Axios
│
└── types/
    └── index.ts                  ← Esquemas Zod y tipos TypeScript
```

### Organización por responsabilidades

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Configuración | `main.tsx`, `router.tsx` | Arrancar app y definir rutas |
| Estructura | `layouts/` | Parte fija de la interfaz |
| Páginas | `views/` | Una pantalla por ruta; orquesta datos y componentes |
| UI reutilizable | `components/` | Piezas visuales sin saber de rutas ni de la API |
| Acceso a datos | `api/` + `lib/` | Todo lo que habla con el backend |
| Contratos de datos | `types/` | Forma de los datos |

**Idea clave:** los componentes **no** llaman a `axios` directamente. Llaman a funciones de `api/`, que usan la instancia de `lib/axios.ts`. Si mañana cambia la URL o la librería HTTP, solo tocas un lugar.

---

## 4. Cómo se conecta cada archivo

```
index.html ──► main.tsx
                 │ crea QueryClient y lo provee (QueryClientProvider)
                 ▼
              router.tsx  (BrowserRouter + Routes)
                 │
                 ▼
            AppLayout.tsx ── usa ──► Logo.tsx, NavMenu.tsx, <ToastContainer/>
                 │ <Outlet/> pinta la view que coincida con la URL
                 ▼
 ┌───────────────┬──────────────────────┬───────────────────────────┐
 │ DashboardView │  CreateProjectView   │      EditProjectView      │
 │  (useQuery)   │  (useForm+useMutation)│  (useQuery → EditProjectForm)
 └──────┬────────┴──────────┬───────────┴─────────────┬─────────────┘
        │                   │                         │
        │                   └──► ProjectForm.tsx ◄────┘ (campos compartidos)
        │                              │
        │                              └──► ErrorMessage.tsx
        ▼
   api/ProjectAPI.ts ──usa──► lib/axios.ts ──HTTP──► BACKEND (Express)
        │
        └──usa──► types/index.ts (Zod + tipos)
```

Lectura del diagrama:

1. `index.html` carga `main.tsx`.
2. `main.tsx` envuelve la app con el proveedor de React Query y pinta `Router`.
3. `router.tsx` decide qué view mostrar según la URL, siempre dentro de `AppLayout`.
4. Las views usan hooks de React Query que llaman funciones de `ProjectAPI.ts`.
5. `ProjectAPI.ts` usa la instancia de `axios.ts` para hacer la petición al backend.
6. `types/index.ts` aporta los tipos usados en todas las capas.

---

## 5. Alias de rutas (`@/`)

En lugar de escribir rutas relativas feas (`../../../api/ProjectAPI`) se usa `@/api/ProjectAPI`.

Debe configurarse en **dos sitios** (uno para Vite y otro para TypeScript):

**`vite.config.ts`** – para que el empaquetador sepa resolverlo:
```ts
resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
```

**`tsconfig.app.json`** – para que el editor/TypeScript lo entienda:
```json
"baseUrl": "src",
"paths": {
  "@/components/*": ["components/*"],
  "@/views/*": ["views/*"],
  "@/layouts/*": ["layouts/*"],
  "@/api/*": ["api/*"],
  "@/types/*": ["types/*"],
  "@/lib/*": ["lib/*"]
}
```

Si añades una carpeta nueva y quieres usar el alias, agrégala también a `paths`.

---

## 6. Punto de entrada: `main.tsx`

```tsx
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router/>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>,
)
```

- `createRoot(...)` monta React dentro del `<div id="root">` de `index.html`.
- `StrictMode` activa advertencias extra en desarrollo (por ejemplo, renderiza dos veces para detectar efectos secundarios).
- `QueryClient` es el **cerebro de la caché** de React Query. Se crea **una sola vez, fuera de los componentes**.
- `QueryClientProvider` usa el **Context de React** para que cualquier componente hijo pueda acceder a ese `queryClient` mediante `useQuery`, `useMutation` o `useQueryClient`.
- `ReactQueryDevtools` muestra una pestañita flotante (solo en desarrollo) para inspeccionar las consultas.

---

## 7. Rutas con React Router DOM

`router.tsx`:

```tsx
<BrowserRouter>
  <Routes>
    <Route element={<AppLayout/>}>
      <Route path='/' element={<DashboardView/>} index />
      <Route path='/projects/create' element={<CreateProjectView/>}/>
      <Route path='/projects/:projectId/edit' element={<EditProjectView/>}/>
    </Route>
  </Routes>
</BrowserRouter>
```

| Pieza | Qué hace |
|---|---|
| `BrowserRouter` | Habilita el enrutado usando la URL real del navegador (History API) |
| `Routes` | Revisa la URL actual y renderiza **solo** la `Route` que coincida |
| `Route path element` | "Si la URL es `path`, muestra `element`" |
| `Route` sin `path` pero con `element` | **Ruta de layout**: envuelve a sus hijas con un componente común |
| `index` | Ruta por defecto del padre |

### Tabla de rutas

| URL | View | Descripción |
|---|---|---|
| `/` | `DashboardView` | Lista de proyectos |
| `/projects/create` | `CreateProjectView` | Formulario para crear |
| `/projects/:projectId/edit` | `EditProjectView` | Formulario para editar |

### Parámetros dinámicos (`:projectId`)

Los dos puntos declaran un **parámetro**: `/projects/:projectId/edit` coincide con `/projects/65f0c2.../edit` y el valor se lee con `useParams()`:

```tsx
const params = useParams()
const projectId = params.projectId!   // el nombre debe ser igual al de la ruta
```

> ⚠️ Los `:` van **solo en la definición de la ruta**, nunca en el enlace real.
> ✅ `to={`/projects/${project._id}/edit`}`
> ❌ `to={`/projects/:${project._id}/edit`}` → genera `/projects/:65f.../edit` y da 404.

### Navegar sin recargar la página

| Herramienta | Uso |
|---|---|
| `<Link to="/">` | Enlace que cambia la URL sin recargar (reemplaza a `<a>`) |
| `useNavigate()` | Navegar desde código (ej. al terminar de guardar → `navigate('/')`) |
| `<Navigate to="..."/>` | Redirigir al renderizar un componente |
| `<Outlet/>` | Marca dónde se pinta la ruta hija dentro de un layout |

---

## 8. Layout y `Outlet`

`AppLayout.tsx` es la estructura repetida en todas las páginas:

```tsx
<>
  <header> <Logo/> <NavMenu/> </header>
  <section> <Outlet/> </section>
  <ToastContainer pauseOnHover={false} pauseOnFocusLoss={false}/>
</>
```

- Header y menú **no se vuelven a montar** al cambiar de página; solo cambia lo que hay dentro de `<Outlet/>`.
- `<ToastContainer/>` va aquí **una sola vez**: es el "lienzo" donde aparecen todas las notificaciones lanzadas con `toast.success()` / `toast.error()` desde cualquier parte.
- Se importa el CSS de toastify: `import 'react-toastify/dist/ReactToastify.css'`.

---

## 9. Conexión con el backend: Axios, API y CORS

### 9.1 Instancia de Axios (`lib/axios.ts`)

```ts
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})
export default api
```

Una **instancia** con la URL base ya configurada. Así `api.get('/projects')` realmente llama a `http://localhost:4000/api/projects`. Si el día de mañana se despliega en otro servidor, solo cambias la variable de entorno.

### 9.2 Funciones de la API (`api/ProjectAPI.ts`)

Cada función = un endpoint del backend:

| Función | Petición | Retorna |
|---|---|---|
| `createProject(formData)` | `POST /projects` | texto de éxito |
| `getProjects()` | `GET /projects` | lista de proyectos (validada con Zod) |
| `getProjectById(id)` | `GET /projects/:id` | un proyecto |
| `updateProject({formData, projectId})` | `PUT /projects/:id` | texto de éxito |
| `deleteProject(id)` | `DELETE /projects/:id` | texto de éxito |

Estructura repetida en todas:

```ts
export async function createProject(formData: ProjectFormData) {
    try {
        const { data } = await api.post('/projects', formData)   // 1. hace la petición
        return data                                              // 2. devuelve el body
    } catch (error) {
        if (isAxiosError(error) && error.response) {             // 3. error con respuesta del servidor
            const { errors, error: message } = error.response.data
            throw new Error(errors?.[0]?.msg ?? message ?? 'Error al crear el proyecto')
        }
        throw error
    }
}
```

- Axios devuelve un objeto con `data` (el cuerpo de la respuesta), `status`, etc.; se extrae con `{ data }`.
- `isAxiosError(error)` comprueba que el fallo sea de Axios; `error.response` existe cuando el servidor sí respondió (con `400`, `404`...).
- Se **relanza un `Error` con un mensaje legible** para que `useMutation`/`useQuery` lo reciban en `onError` / `error` y se muestre en un toast.
- El formato `errors?.[0]?.msg` / `error` coincide con las dos formas en que responde el backend (`{errors: [...]}` de express-validator y `{error: "..."}` de los 404).

> `updateProject` recibe **un solo objeto** `{formData, projectId}` porque `mutationFn` de React Query solo acepta **un argumento**.

### 9.3 CORS: por qué es necesario

El frontend corre en `http://localhost:5173` y la API en `http://localhost:4000`. Distinto puerto = **distinto origen**, y el navegador bloquea por seguridad esas peticiones salvo que el servidor las autorice.

```
Navegador (origen :5173)                        Servidor Express (:4000)
        │  OPTIONS /api/projects  (preflight)           │
        │  Origin: http://localhost:5173  ─────────────►│
        │                                               │ cors() compara Origin con FRONTEND_URL
        │◄───────── Access-Control-Allow-Origin ────────│
        │  POST /api/projects (la petición real)        │
        │──────────────────────────────────────────────►│
        │◄─────────────────── respuesta ────────────────│
```

- El **frontend no configura nada de CORS**; es responsabilidad del backend.
- En el backend, `FRONTEND_URL` del `.env` debe ser **exactamente** el origen del frontend (`http://localhost:5173`, sin `/` final).
- Si ves en consola `blocked by CORS policy`, revisa: 1) que el backend esté arriba, 2) que `FRONTEND_URL` coincida, 3) que reiniciaste el backend tras cambiar el `.env`.

---

## 10. Tipos y validación con Zod (`types/index.ts`)

```ts
export const ProjectSchema = z.object({
    _id: z.string(),
    projectName: z.string(),
    clientName: z.string(),
    description: z.string(),
})

export const dashboardProjectSchema = z.array(
    ProjectSchema.pick({ _id: true, projectName: true, clientName: true, description: true })
)

export type Project = z.infer<typeof ProjectSchema>
export type ProjectFormData = Pick<Project, 'clientName' | 'projectName' | 'description'>
```

| Concepto | Explicación |
|---|---|
| **Schema Zod** | Describe la forma esperada de un dato y **valida en tiempo de ejecución** |
| `z.infer<typeof ProjectSchema>` | Genera el tipo TypeScript a partir del schema (una sola fuente de verdad) |
| `.pick({...})` | Crea un nuevo schema con solo algunos campos |
| `Pick<Project, ...>` | Tipo de TypeScript con solo algunas propiedades; `ProjectFormData` = lo que llena el formulario (sin `_id`) |
| `safeParse(data)` | Valida sin lanzar error; devuelve `{success: true, data}` o `{success: false, error}` |

**¿Por qué Zod si ya está TypeScript?** TypeScript solo existe mientras programas; **no valida lo que llega del servidor**. Zod comprueba en ejecución que la respuesta realmente tenga la forma esperada. En `getProjects` se aplica con `dashboardProjectSchema.safeParse(data)`.

---

## 11. Views (páginas)

### `DashboardView.tsx` – ruta `/`

Muestra la lista de proyectos.

```tsx
const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
})
if (isLoading) return 'Cargando...'
if (data) return ( ...lista... )
```

- Mientras carga, muestra "Cargando...".
- Si hay datos y la lista no está vacía, hace `data.map(project => <li key={project._id}>...)`. La `key` ayuda a React a identificar cada elemento.
- Si la lista está vacía, muestra "No hay proyectos aún" con enlace a crear uno.
- Cada proyecto tiene un menú de tres puntos (`Menu` de Headless UI) con: *Ver Proyecto* (pendiente), **Editar Proyecto** (`/projects/${project._id}/edit`) y *Eliminar Proyecto* (pendiente: el `onClick` está vacío).

### `CreateProjectView.tsx` – ruta `/projects/create`

Formulario para crear. Combina `useForm` (formulario) + `useMutation` (envío al backend) + `useNavigate` (volver al inicio). Detalle en las secciones 13 y 17.

### `EditProjectView.tsx` – ruta `/projects/:projectId/edit`

Esta view **no dibuja el formulario**; su trabajo es obtener los datos:

```tsx
const params = useParams()
const projectId = params.projectId!

const { data, isLoading, isError } = useQuery({
    queryKey: ['editProject', projectId],
    queryFn: () => getProjectById(projectId),
    retry: false
})

if (isLoading) return 'Cargando...'
if (isError) return <Navigate to='/404' />
if (data) return <EditProjectForm data={data} projectId={projectId}/>
```

- `queryKey: ['editProject', projectId]` → cada proyecto tiene su propia entrada de caché.
- `queryFn: () => getProjectById(projectId)` → se usa una función flecha porque hay que pasar un argumento.
- `retry: false` → por defecto React Query reintenta 3 veces si falla; para un 404 no tiene sentido esperar.
- `isError` → si el proyecto no existe, redirige a `/404`.
- Solo cuando hay `data` se renderiza `EditProjectForm`. Esto es **importante** (ver sección 15): `useForm` toma sus valores iniciales al montarse, por eso el formulario debe crearse cuando los datos ya existen.

**Patrón view + form:** la view se ocupa de *cargar*, el componente de formulario de *editar*. Separarlos evita montar el formulario sin datos.

---

## 12. Componentes

### `Logo.tsx`
Título "UpTask" con estilos. Componente de presentación puro.

### `NavMenu.tsx`
Menú tipo hamburguesa con `Popover` y `Transition` de **Headless UI** (maneja abrir/cerrar, foco y accesibilidad; Tailwind pone el aspecto). Contiene enlaces a *Mi Perfil* (`/profile`, ruta aún no creada), *Mis Proyectos* (`/`) y *Cerrar Sesión* (sin funcionalidad todavía).

### `ErrorMessage.tsx`
```tsx
export default function ErrorMessage({ children }: { children: React.ReactNode }) {
    return <div className="...rojo...">{children}</div>
}
```
Caja roja para mostrar errores de validación. Usa la prop especial **`children`** (lo que se escribe entre las etiquetas): `<ErrorMessage>texto</ErrorMessage>`.

### `projects/ProjectForm.tsx`
Los **tres campos** (nombre del proyecto, cliente, descripción) con su validación. Es **compartido** entre crear y editar, para no duplicar código.

```tsx
type ProjectFormProps = {
    register: UseFormRegister<ProjectFormData>
    errors: FieldErrors<ProjectFormData>
}
```
No tiene su propio `useForm`: recibe `register` y `errors` **por props** desde el formulario padre. Así los campos quedan conectados al formulario del padre.

### `projects/EditProjectForm.tsx`
Formulario completo de edición: encabezado, botón "Volver", `<form>`, `ProjectForm`, y la lógica de `useForm` + `useMutation` para guardar los cambios.

---

## 13. Formularios con React Hook Form

React Hook Form (RHF) maneja los inputs **sin re-renderizar en cada tecla** (usa inputs no controlados) y simplifica la validación.

### Conexión paso a paso

```tsx
// 1. Valores iniciales
const initialValues: ProjectFormData = { projectName: "", clientName: "", description: "" }

// 2. Crear el formulario
const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initialValues })

// 3. Función que recibe los datos YA validados
const handleForm = (formData: ProjectFormData) => { mutation.mutate(formData) }

// 4. Conectar al <form>
<form onSubmit={handleSubmit(handleForm)} noValidate>
    <ProjectForm register={register} errors={errors} />
    <input type="submit" value="Crear Proyecto" />
</form>
```

| Pieza | Qué hace |
|---|---|
| `useForm({defaultValues})` | Crea el formulario con valores iniciales |
| `register('campo', reglas)` | Conecta un input con RHF y define sus reglas (`required`, mensajes...) |
| `handleSubmit(fn)` | Evita el envío por defecto, valida, y **solo si todo es válido** llama a `fn(datos)` |
| `formState.errors` | Objeto con los errores de cada campo |
| `noValidate` en `<form>` | Desactiva las burbujas de validación nativas del navegador; así mandan los mensajes de RHF |

### Cómo funciona `register`

```tsx
<input id="projectName" {...register("projectName", { required: "El Titulo del Proyecto es obligatorio" })} />
{errors.projectName && <ErrorMessage>{errors.projectName.message}</ErrorMessage>}
```

`{...register("projectName", ...)}` expande al input las propiedades `name`, `onChange`, `onBlur` y `ref`. El texto de `required` es el mensaje que luego aparece en `errors.projectName.message`.

### Doble validación

1. **Cliente (RHF):** respuesta inmediata, evita llamadas innecesarias.
2. **Servidor (express-validator):** nunca se confía solo en el cliente. Si el backend rechaza algo, el mensaje llega al toast mediante `onError`.

### Edición: `defaultValues` con datos reales

```tsx
const initialValues = { projectName: data.projectName, clientName: data.clientName, description: data.description }
const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initialValues })
```
Los inputs aparecen ya llenos. Se copian solo tres campos (el backend devuelve más: `_id`, `tasks`, fechas...) porque `ProjectFormData` solo necesita esos.

---

## 14. Consultas (`useQuery`) y mutaciones (`useMutation`)

React Query distingue dos tipos de operaciones:

| | `useQuery` | `useMutation` |
|---|---|---|
| Propósito | **Leer** datos (GET) | **Modificar** datos (POST, PUT, DELETE) |
| Cuándo se ejecuta | Automáticamente al montar el componente | Solo cuando llamas a `mutate()` |
| Caché | Sí, usa `queryKey` | No cachea; invalida consultas relacionadas |
| Devuelve | `data`, `isLoading`, `isError`, `error`... | `mutate`, `isPending`, `isError`... |

### `useQuery`

```tsx
const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],   // identificador único en la caché
    queryFn: getProjects      // función asíncrona que devuelve los datos
})
```

- **`queryKey`**: es la "etiqueta" del dato en la caché. Si dos componentes usan la misma key, comparten datos.
- Las keys con variables incluyen el valor: `['editProject', projectId]`; cada proyecto se cachea por separado.
- `isLoading`: `true` la primera vez que carga y no hay datos.
- React Query evita duplicar peticiones, muestra datos en caché al instante y los refresca en segundo plano.

### `useMutation`

```tsx
const mutation = useMutation({
    mutationFn: createProject,                  // qué función llamar
    onError: (error) => { toast.error(error.message) },   // si falla
    onSuccess: (data) => {                      // si funciona; `data` es lo que devolvió createProject
        toast.success(data)
        navigate('/')
    }
})

mutation.mutate(formData)    // dispara la mutación pasando el argumento
```

- `mutationFn` recibe **un único argumento** (por eso `updateProject` recibe un objeto).
- `onSuccess(data)` recibe lo que devuelve la función de la API. Como el backend responde con texto ("Proyecto creado correctamente..."), eso se muestra directamente en el toast.
- `onError(error)` recibe el `Error` que lanzó `ProjectAPI.ts` con el mensaje ya limpio.

### Resumen del flujo de una mutación

```
submit → handleSubmit (valida) → handleForm → mutate(formData)
       → mutationFn (api.post) → backend responde
              ├─ OK    → onSuccess → toast.success + (invalidar caché) + navigate('/')
              └─ Error → onError   → toast.error(mensaje)
```

---

## 15. Invalidación de consultas: ¿por qué se hace?

React Query **guarda en caché** los datos de cada `queryKey`. Eso es excelente para el rendimiento, pero crea un problema: **después de modificar datos en el servidor, la caché queda desactualizada** (*stale*).

### Qué hace `invalidateQueries`

```tsx
const queryClient = useQueryClient()

onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })
    queryClient.invalidateQueries({ queryKey: ['editProject', projectId] })
    toast.success(data)
    navigate('/')
}
```

`invalidateQueries({queryKey})` marca como **obsoletas** las consultas con esa key y, si hay componentes usándolas, **vuelve a pedir los datos al backend**.

### Por qué en `EditProjectForm` se invalidan DOS keys

| Key invalidada | Motivo |
|---|---|
| `['projects']` | La lista del dashboard muestra nombre, cliente y descripción. Tras editar, debe mostrar los nuevos valores. |
| `['editProject', projectId]` | Es la caché del formulario de edición. **Sin invalidarla, al volver a editar el mismo proyecto el formulario podría mostrar los valores viejos.** |

#### El caso sutil del formulario

`useForm({ defaultValues })` **solo lee los valores iniciales la primera vez que se monta**. Si React Query entrega primero datos viejos desde la caché, el formulario se llena con ellos y, aunque después llegue la versión nueva, los inputs no se actualizan. Invalidar `['editProject', projectId]` obliga a descartar esos datos viejos.

### En `CreateProjectView`

Actualmente **no** invalida `['projects']`. Funciona porque, por defecto, React Query vuelve a pedir los datos al montar el Dashboard (`staleTime` es 0), pero primero muestra brevemente la lista vieja. Lo recomendable es añadir también `queryClient.invalidateQueries({ queryKey: ['projects'] })` para que la lista siempre esté fresca.

### Regla práctica

> **Cada vez que una mutación cambia datos, invalida las `queryKey` que muestran esos datos.**

| Mutación | Keys a invalidar |
|---|---|
| Crear proyecto | `['projects']` |
| Editar proyecto | `['projects']`, `['editProject', id]` |
| Eliminar proyecto | `['projects']` |

---

## 16. Todos los hooks utilizados

Un **hook** es una función especial de React (empieza con `use`) que permite usar funcionalidades dentro de componentes de función. Reglas: se llaman solo en el nivel superior del componente (no dentro de `if`/bucles) y solo en componentes u otros hooks.

### De React Router

| Hook | Dónde | Qué hace |
|---|---|---|
| `useNavigate()` | `CreateProjectView`, `EditProjectForm` | Devuelve una función para cambiar de ruta desde código: `navigate('/')` |
| `useParams()` | `EditProjectView` | Devuelve los parámetros dinámicos de la URL: `{ projectId: "65f..." }` |

### De TanStack Query

| Hook | Dónde | Qué hace |
|---|---|---|
| `useQuery()` | `DashboardView`, `EditProjectView` | Lee y cachea datos del servidor |
| `useMutation()` | `CreateProjectView`, `EditProjectForm` | Ejecuta operaciones que modifican datos |
| `useQueryClient()` | `EditProjectForm` | Da acceso al `queryClient` para invalidar/leer la caché |

### De React Hook Form

| Hook | Dónde | Qué hace |
|---|---|---|
| `useForm()` | `CreateProjectView`, `EditProjectForm` | Crea y controla el formulario. Devuelve `register`, `handleSubmit`, `formState`, etc. |

### Otras piezas relacionadas (no son hooks, pero se usan junto a ellos)

| Pieza | Qué hace |
|---|---|
| `toast.success()` / `toast.error()` | Muestra notificaciones (requiere `<ToastContainer/>` en el layout) |
| `isAxiosError()` | Verifica si un error proviene de Axios |
| `Menu`, `Popover`, `Transition` (Headless UI) | Componentes con comportamiento accesible incorporado |

### Hooks de React básicos

El proyecto no usa directamente `useState` ni `useEffect`: React Query ya gestiona el estado de carga y datos (lo que antes se hacía con `useEffect` + `useState`), y React Hook Form gestiona el estado del formulario.

---

## 17. Flujos completos paso a paso

### A) Ver la lista de proyectos

1. Abres `/` → `Routes` renderiza `AppLayout` y dentro (por `Outlet`) `DashboardView`.
2. `useQuery({queryKey:['projects'], queryFn:getProjects})` se ejecuta.
3. `getProjects` → `api('/projects')` → `GET http://localhost:4000/api/projects`.
4. El backend revisa CORS y responde un JSON con los proyectos.
5. `dashboardProjectSchema.safeParse(data)` valida la forma y devuelve los datos.
6. `data` se llena y la vista se vuelve a renderizar mostrando la lista.

### B) Crear un proyecto

1. Click en "Nuevo Proyecto" → `Link` a `/projects/create`.
2. Rellenas el formulario; `register` conecta los inputs.
3. Envías → `handleSubmit` valida; si falta algo, `errors` muestra `ErrorMessage`.
4. Con todo válido se ejecuta `handleForm(formData)` → `mutation.mutate(formData)`.
5. `createProject` hace `POST /projects` con el JSON.
6. Backend: valida con `express-validator` → controlador → guarda en MongoDB → `"Proyecto creado correctamente..."`.
7. `onSuccess` → `toast.success(texto)` y `navigate('/')`.
8. Si el backend devolvió `400`, `createProject` lanza `Error(msg)` y `onError` muestra `toast.error(msg)`.

### C) Editar un proyecto

1. En el dashboard, menú de tres puntos → "Editar Proyecto" → `/projects/<_id>/edit`.
2. `Routes` coincide con `/projects/:projectId/edit` → `EditProjectView`.
3. `useParams()` extrae `projectId`.
4. `useQuery(['editProject', projectId])` → `GET /projects/<id>`.
5. Si falla (404) → `<Navigate to='/404'/>`. Si va bien → `<EditProjectForm data={data} projectId={projectId}/>`.
6. El formulario aparece con los valores cargados (`defaultValues`).
7. Al guardar → `mutate({formData, projectId})` → `PUT /projects/<id>`.
8. `onSuccess` → invalida `['projects']` y `['editProject', projectId]`, muestra toast y `navigate('/')`.
9. El dashboard se muestra con los datos actualizados.

---

## 18. Estilos

- Se usa **Tailwind CSS v4**: las clases (`bg-purple-400`, `text-5xl`, `p-3`...) se escriben directamente en el JSX.
- `src/index.css` solo contiene `@import "tailwindcss"`.
- Se integra mediante PostCSS (`postcss.config.js` con `@tailwindcss/postcss`).
- En Tailwind v4 la detección de archivos es automática; `tailwind.config.js` queda como configuración heredada sin efecto relevante.
- Prefijos como `hover:` (al pasar el mouse), `lg:` (pantallas grandes) y `transition-colors` (animación de color) también son clases de Tailwind.

---

## 19. Problemas conocidos y mejoras

### 🔴 Para revisar

1. **No existe la ruta `/404`.** `EditProjectView` hace `<Navigate to='/404'/>`, pero `router.tsx` no la define: aparecerá una pantalla vacía. Crea una `NotFoundView` y añade `<Route path='*' element={<NotFoundView/>} />`.
2. **`/profile`** (enlace en `NavMenu`) tampoco existe aún.
3. **`getProjects` y `getProjectById` pueden devolver `undefined`**: si `safeParse` falla o hay un error sin `response`, la función termina sin retornar ni lanzar. React Query lo tomaría como éxito sin datos. Conviene lanzar un error en esos casos.
4. **`getProjectById` no valida con Zod** (devuelve `data` sin tipar); `getProjects` sí.
5. **HTML inválido en `DashboardView`**: hay un `<ul>` dentro de un `<p>`. Debería usarse un fragmento (`<>...</>`) o un `<div>`.
6. **Botones sin funcionalidad**: "Ver Proyecto" (`to={``}`), enlace del nombre del proyecto y "Eliminar Proyecto" (`onClick={() => {}}`). `deleteProject` ya existe en `ProjectAPI.ts`, solo falta conectarlo con un `useMutation` que invalide `['projects']`.

### 🟡 Mejoras

- **`CreateProjectView`** debería invalidar `['projects']` (ver sección 15).
- **Import inconsistente** en `ProjectForm.tsx`: `import type { ProjectFormData } from "types"` funciona por `baseUrl`, pero el resto del proyecto usa `@/types/index`.
- **Estado de envío**: usar `mutation.isPending` para deshabilitar el botón y evitar envíos dobles.
- **Mostrar el error de carga** en lugar de solo "Cargando...".
- **`.env.local`** no debe subirse a git si en el futuro contiene datos sensibles (las variables `VITE_` son públicas en el navegador, nunca guardes secretos ahí).
- Cuando exista autenticación, el token se añadiría en un **interceptor** de `lib/axios.ts`.

---

## 20. Glosario

| Término | Significado |
|---|---|
| **SPA** | Single Page Application: una sola página HTML; React cambia el contenido sin recargar |
| **Componente** | Función que devuelve JSX (parte de la interfaz) |
| **Props** | Datos que un componente padre pasa a uno hijo |
| **View** | Componente que representa una página completa (convención de este proyecto) |
| **Layout** | Componente con la estructura común a varias páginas |
| **Hook** | Función `useAlgo` que añade capacidades a un componente |
| **Provider** | Componente que ofrece datos a todos sus descendientes (Context) |
| **queryKey** | Identificador de una consulta en la caché de React Query |
| **Caché** | Memoria donde React Query guarda respuestas para reutilizarlas |
| **Stale** | Dato considerado desactualizado que conviene volver a pedir |
| **Invalidar** | Marcar datos de la caché como obsoletos para forzar un refetch |
| **Mutación** | Operación que modifica datos en el servidor |
| **Toast** | Notificación emergente temporal |
| **CORS** | Regla del navegador que el servidor debe autorizar para peticiones entre orígenes distintos |
| **Preflight** | Petición `OPTIONS` previa que hace el navegador antes de un `POST`/`PUT`/`DELETE` |
| **Alias** | Atajo de importación (`@/` = `src/`) |
| **Zod** | Librería para definir y validar esquemas de datos |
