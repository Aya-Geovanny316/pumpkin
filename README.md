# Eternal Tulips

Experiencia romántica WebGL construida con siete tulipanes procedurales y un renderizador ASCII coloreado. La escena usa Three.js para la geometría 3D, shaders GLSL para el material orgánico y GSAP para la floración cinematográfica.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Para probar la compilación de producción:

```bash
npm run build
npm run preview
```

## Personalización

Edita [`src/config.ts`](src/config.ts) para cambiar:

- cantidad, posición, altura e inclinación de los tulipanes;
- paleta de pétalos, tallos y partículas;
- densidad ASCII y calidad adaptativa;
- velocidad de crecimiento y movimiento;
- dedicatoria, iniciales del Easter Egg y archivo de audio local.

Para música ambiental, coloca un archivo local dentro de `public/` y asigna su ruta en `CONFIG.music.file`. El navegador solo comenzará la reproducción después de la primera interacción.

## Interacciones

- Cursor o toque: parallax y selección de flores.
- Toque sobre una flor: brillo y partículas rosas.
- Tres toques sobre el tulipán central: Easter Egg con las iniciales configuradas.
- Controles discretos: sonido, reinicio y pantalla completa.

La animación se pausa cuando la pestaña deja de estar visible y respeta `prefers-reduced-motion`.

## Netlify

El repositorio incluye `netlify.toml`. En Netlify usa el comando `npm run build` y el directorio de publicación `dist`. No necesita backend ni variables de entorno.
