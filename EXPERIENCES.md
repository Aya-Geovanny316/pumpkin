# Experiencias de Mi calabacita

Las tres experiencias nuevas viven en `experiences.js` y `experiences.css`. No requieren framework ni instalación de dependencias.

## Coco y Nacho

Edita `CONFIG.characters` en `experiences.js` para cambiar nombres, colores y cumpleaños:

```js
characters: {
  coco: { name: 'Coco', color: '#f4c27b', accent: '#78b8ca', birthday: [2, 12] },
  nacho: { name: 'Nacho', color: '#d8b4e8', accent: '#f2b7c5', birthday: [2, 19] }
}
```

Los personajes actuales son ilustraciones temporales genéricas. Cuando existan fotografías de referencia, reemplaza la función `characterArt` por imágenes o SVG derivados de esas referencias sin cambiar la interacción.

La fecha de cumpleaños se calcula con `America/Guatemala`. Los pequeños mensajes y corazones funcionan sin conexión.

## Regalitos

Agrega o edita objetos dentro de `CONFIG.gifts`:

```js
{ id: 'mi-regalo', icon: '✦', title: 'Título', type: 'special', text: 'Sorpresa' }
```

Tipos disponibles: `letter`, `photo`, `voucher`, `audio` y `special`. Las fotos usan una ruta local, por ejemplo `album/pumpkin.jpeg`. Para audio, agrega una propiedad `audio` y extiende `openGift` si quieres conectar un archivo real.

Los regalos descubiertos y los vales utilizados se guardan en `localStorage` del navegador. No se sincronizan entre dispositivos porque el proyecto no tiene backend.

El calendario de Adviento se muestra desde el botón de diciembre y desbloquea los días según la fecha de `America/Guatemala`. En un sitio estático el reloj del navegador no puede validarse contra una hora confiable; para impedir manipulación se necesitaría un endpoint o backend.

## Libro para colorear

Las ocho ilustraciones están en el arreglo `ART` de `experiences.js`. Cada zona tiene la clase `color-zone`, por lo que puede cambiarse por un SVG original manteniendo esa clase.

El libro permite:

- Rellenar zonas cerradas.
- Dibujar con pincel.
- Borrar trazos.
- Elegir colores pastel y grosores.
- Deshacer y rehacer.
- Guardar y continuar desde el mismo dispositivo.
- Descargar la página actual como PNG.

El progreso se almacena con la clave `mi-calabacita-coloring`. La colaboración entre dispositivos queda preparada conceptualmente, pero requiere backend y comunicación en tiempo real.

## Archivos

- `experiences.js`: contenido, estado, interacciones y persistencia.
- `experiences.css`: estilos responsive y animaciones.
- `index.html`: conserva la carta, el álbum, las fotos, el video y la playlist; solo carga los módulos nuevos.
