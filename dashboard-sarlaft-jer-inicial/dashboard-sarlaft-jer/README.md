# Dashboard SARLAFT JER — guía de instalación

Este proyecto es una **primera versión funcional de la estructura** del dashboard basada en el PDF y el Excel que compartiste. El diseño usa la franja azul, títulos centrados, tablas a la izquierda y gráficas a la derecha, y conserva el orden de los bloques de monitoreo del informe. Las gráficas se dibujan con Chart.js y se pueden exportar juntas a PDF.

> **Antes de publicar:** el Excel contiene información operativa de cumplimiento. Una página de GitHub Pages normalmente puede ser visitada por terceros. Si el endpoint de Apps Script se despliega con acceso **“Cualquier persona”**, los datos que entrega ese endpoint podrán consultarse públicamente. Publica esta versión así solamente si JER autoriza que esos datos sean públicos. No pongas contraseñas ni claves secretas en `config.js`; cualquier visitante puede inspeccionar el JavaScript.

## 1. Qué archivos hay y para qué sirve cada uno

```text
dashboard-sarlaft-jer/
├── index.html             # La página principal que abre el navegador
├── css/
│   └── styles.css         # Colores, tamaños, tablas, encabezados y diseño de informe
├── js/
│   ├── config.js          # URL de Apps Script y orden de páginas/gráficas
│   └── app.js             # Consulta datos, dibuja tablas/gráficas y genera PDF
├── apps-script/
│   └── Code.gs            # API que lee las pestañas de Google Sheets
└── README.md              # Esta guía
```

`index.html` se queda en la carpeta principal. No cambies los nombres ni muevas los archivos de carpeta a menos que también actualices las rutas dentro de `index.html`.

## 2. Preparar la base de datos en Google Sheets

1. Sube `CONSOLIDADO PARA INFORMES LOOKER 2026 en adelante(1).xlsx` a Google Drive.
2. Haz doble clic para abrirlo y selecciona **Guardar como Hojas de cálculo de Google**. Trabaja sobre esa copia convertida a Google Sheets.
3. Comprueba que las pestañas conserven sus nombres. Algunas tienen espacios al principio o al final, así que no los borres por ahora.
4. En la barra de dirección verás una URL parecida a `https://docs.google.com/spreadsheets/d/ID_DEL_LIBRO/edit`. Copia solamente la parte `ID_DEL_LIBRO`, es decir, lo que está entre `/d/` y `/edit`.

El libro revisado tiene **67 pestañas**. Las primeras 54 hojas contienen métricas de giros, premios y Betplay; las restantes contienen ROS/ROI, reportes a entes de control, debida diligencia, PEP/extranjeros, capacitaciones, inducciones, beneficiarios finales, formación, actividades, reuniones y cursos. El servicio lee las hojas necesarias para los años disponibles, pero **solo envía al navegador las pestañas usadas en las páginas del informe**; las hojas `BENEFICIARIOS FINALES` y `cursos` no se muestran en esta primera versión porque no tienen una página independiente evidente en el PDF.

## 3. Crear el servicio de Google Apps Script

1. Abre la copia de Google Sheets.
2. En el menú de arriba, entra a **Extensiones → Apps Script**.
3. En el editor que se abre, selecciona el archivo `Code.gs` que aparece en el proyecto. Borra el código de ejemplo y pega el contenido del archivo `apps-script/Code.gs` de esta carpeta.
4. En la primera línea de configuración, busca:

   ```javascript
   const SPREADSHEET_ID = 'PEGA_AQUI_EL_ID_DE_GOOGLE_SHEETS';
   ```

   Reemplaza el texto entre comillas por el ID que copiaste de Google Sheets. Conserva las comillas.
5. Pulsa **Guardar**.
6. En la lista de funciones de la parte superior, selecciona `probarConexion` y pulsa **Ejecutar**.
7. Google te pedirá permisos la primera vez. Revisa que estás usando la cuenta que tiene acceso al libro y concede los permisos necesarios.
8. Abre el registro de ejecución. Deberías ver el nombre del libro, los años encontrados y cuántas hojas se leyeron. Si hay advertencias de hojas no encontradas, no sigas todavía: revisa los nombres de las pestañas y los espacios.

La función de prueba no modifica tus datos; únicamente comprueba que el script puede leer las hojas configuradas.

## 4. Publicar el Web App de Apps Script

Esta parte requiere elegir los permisos correctos según la política de JER.

1. Dentro de Apps Script, pulsa **Implementar → Nueva implementación**.
2. En el tipo de implementación, elige **Aplicación web**.
3. En **Ejecutar como**, elige tu cuenta, si esa es la cuenta autorizada para leer el libro.
4. En **Quién tiene acceso**, elige una opción aprobada por el responsable de la información.
   - **Datos autorizados para ser públicos:** “Cualquier persona” puede servir para que GitHub Pages consulte sin inicio de sesión.
   - **Datos internos o confidenciales:** no elijas “Cualquier persona”. GitHub Pages, por sí solo, no protege el acceso a una API privada. En ese caso se necesita autenticación/autorización corporativa o alojar la interfaz en un entorno controlado, por ejemplo un Google Apps Script restringido al dominio o una plataforma interna aprobada.
5. Pulsa **Implementar** y copia la URL que termina en `/exec`.

La interfaz usa una solicitud JSONP para evitar el bloqueo habitual de CORS entre GitHub Pages y Apps Script. JSONP **no es un sistema de autenticación**. No uses el modo público para datos que deban mantenerse internos.

## 5. Conectar el sitio con Apps Script

1. Abre el archivo `js/config.js`.
2. Arriba encontrarás esta línea:

   ```javascript
   scriptUrl: 'PEGA_AQUI_LA_URL_DEL_WEB_APP_DE_APPS_SCRIPT',
   ```

3. Reemplaza el texto por la URL completa del Web App, por ejemplo `https://script.google.com/macros/s/ID_DE_IMPLEMENTACION/exec`.
4. Guarda el archivo.

No pegues el ID del libro en `config.js`; el ID se configura solamente dentro de `Code.gs`.

## 6. Subir el dashboard a GitHub Pages

1. Descarga y descomprime la carpeta completa del proyecto.
2. En GitHub, crea un repositorio nuevo. Si el sitio contendrá datos internos, detente aquí y confirma primero la política de publicación: GitHub Pages es un sitio estático y no proporciona por sí mismo un control de acceso para cada dato.
3. Sube los archivos manteniendo esta estructura. `index.html` debe estar en la raíz, no dentro de otra carpeta.
4. En el repositorio, abre **Settings → Pages**.
5. En **Build and deployment**, selecciona desplegar desde una rama, elige `main` y la carpeta `/(root)`; guarda.
6. Espera a que GitHub muestre la URL del sitio y ábrela.

Cuando cambies solo datos en Google Sheets, no necesitas volver a subir los archivos: abre el dashboard y pulsa **Consultar**. Cuando cambies código, guarda y sube los archivos modificados a GitHub; si cambias `Code.gs`, vuelve a desplegar una nueva versión de la aplicación web desde Apps Script.

## 7. Usar los filtros

- **Año:** selecciona el año del informe.
- **Mes:** `Todos los meses` muestra la evolución por mes en orden calendario. Al elegir un mes concreto, las tablas y las gráficas muestran ese período.
- **Consultar:** vuelve a pedir los datos a Google Sheets.
- **Descargar PDF:** captura todas las páginas renderizadas del informe en un único PDF horizontal. No descarga solamente la gráfica que tengas visible; exporta el informe completo que aparece en pantalla.

Las gráficas no imprimen un número encima de cada barra; los datos se consultan pasando el cursor por la gráfica. Así se evita repetir etiquetas, superponer números y saturar visualmente las gráficas como ocurre en algunas páginas del PDF original. En las gráficas de actividad y alertas se usa un eje secundario para la serie de alertas cuando corresponde.

## 8. Prueba inicial recomendada

1. Elige el año `2026` y `Todos los meses`.
2. En la primera sección, compara la tabla **Cantidad de giros enviados** de Boyacá con la pestaña `N. GIROS ENV BOY`.
3. Comprueba que los meses aparezcan en este orden: enero, febrero, marzo… diciembre. Solo se muestran los meses que existan en la fuente; no se inventan ceros para meses sin registro.
4. Elige `MARZO` y pulsa **Consultar**. La tabla y la gráfica deben quedarse solo con marzo.
5. Descarga el PDF y revisa varias páginas: portada, giros, Betplay, premios y tablas de actividades.

## 9. Errores comunes

**“Falta configurar la URL de Apps Script”**: pega la URL que termina en `/exec` en `js/config.js`.

**“Configura SPREADSHEET_ID”**: pega el ID del libro en `apps-script/Code.gs`, guarda y vuelve a desplegar el Web App.

**“No se pudo abrir el servicio” o tiempo de espera**: confirma que la implementación de Apps Script esté activa y que hayas copiado la URL `/exec`, no la de edición del script.

**Advertencias de hojas no encontradas**: compara los nombres en el código con las pestañas del libro. Los espacios de algunas pestañas son intencionales y el código los conserva.

**Después de cambiar `Code.gs` sigue saliendo lo viejo**: entra a **Implementar → Administrar implementaciones**, edita el Web App y crea una nueva versión.

**El sitio carga, pero muestra “sin registros”**: verifica el año elegido, el nombre de la pestaña y que la hoja contenga filas para ese año/mes.

## 10. Consideraciones de esta primera versión

- La estructura y los bloques de métricas se basan en el informe PDF compartido, y los nombres de hojas en el Excel compartido.
- Se usan los datos reales solo cuando se conecta el libro de Google Sheets; este paquete no incluye una copia de los datos del archivo.
- Las hojas `BENEFICIARIOS FINALES` y `cursos` existen en el Excel, pero no tienen una página independiente evidente en el PDF compartido. Se dejan fuera de la respuesta de esta primera versión para no alterar el orden del informe; conviene confirmar si deben incorporarse en la versión definitiva.
- Los textos narrativos que aparecen en esta plantilla son una base general de estructura, no una certificación del resultado de monitoreo. Antes de emitir un informe oficial, reemplázalos o valídalos con los textos aprobados por la Oficial de Cumplimiento.
- El logotipo se recortó del encabezado del PDF original que compartiste. La tipografía del cuerpo se aproxima con una fuente estándar; si tienes la tipografía o el archivo de identidad visual oficial, se puede afinar todavía más el parecido.
