<div align="center">

[🇺🇸 English](../english/CONTRIBUTING.md) `‖` [🇪🇸 Español](../español/CONTRIBUTING.md) `‖` [🇵🇹 Português](../portugues/CONTRIBUTING.md) `‖` [🇫🇷 Français](../francais/CONTRIBUTING.md) `‖` [🇮🇹 Italiano](../italiano/CONTRIBUTING.md)

<hr />

<img src="../../public/static/banners/kito_banner_es.png" alt="Kito Banner" />

<hr />

</div>

## 🙌🏼 Bienvenido

¡Bienvenido a la guía de contribución de Kito! Esta guía te proporcionará información importante que debes tener en cuenta al contribuir al proyecto.

## 🌸 Cómo Contribuir

1. **Reporta problemas o errores.**
   Si encuentras o experimentas un problema o error con Kito, puedes reportarlo abriendo un issue en este repositorio con la etiqueta `bug`. Asegúrate de describirlo de manera clara y concisa, explicando qué necesita ser resuelto y por qué crees que es un problema válido.

2. **Solicita nuevas funciones y mejoras.**
   ¿Tienes una idea o mejora en mente? ¡Siéntete libre de compartirla! Abre un issue en este repositorio con la etiqueta `feat`, y será revisada. Proporciona una descripción detallada de lo que quieres agregar y los posibles beneficios.

3. **Contribuye con código.**
   Si deseas contribuir directamente al código, sigue estos pasos:

- Haz un fork del repositorio.
- Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
- Realiza tus cambios en tu rama.
- Confirma tus cambios (consulta la [Guía de Commits](#-guía-de-commits)).
- Sube tu rama (`git push origin feature/nueva-funcionalidad`).
- Abre un Pull Request detallando los cambios que hiciste.

## 📕 Guía de Commits

Para mantener un historial de commits bien organizado y claro, se recomienda seguir estas pautas al escribir commits. Las pautas descritas mejoran la calidad de las contribuciones y pueden aumentar la relevancia de la revisión.

#### Convención

Sigue la convención [Conventional Commits](https://conventionalcommits.org). El uso de emojis es recomendado pero no obligatorio.

#### Longitud

- La primera línea no debe exceder los 50 caracteres y debe ser breve, pero lo suficientemente descriptiva para entender el cambio realizado.

- Después de la primera línea, agrega una línea en blanco y, si es necesario, incluye una descripción más detallada en un párrafo que no exceda los 72 caracteres por línea.

- En la descripción extendida, incluye el "por qué" y el "cómo", no solo el "qué."

**Ejemplo:**

`✨ feat(user-auth): Agregar autenticación basada en JWT`

Implementado un mecanismo de autenticación basado en JWT para usuarios. Esto reemplaza el enfoque anterior basado en sesiones, mejorando la escalabilidad y seguridad en entornos distribuidos. Se han actualizado las pruebas y la documentación en consecuencia.

#### Enfoque

Cada commit debe centrarse en una única tarea o propósito. Evita hacer demasiados cambios en un solo commit y no mezcles modificaciones de diferentes ámbitos o tipos.

**Ejemplo:**

_Commit 1:_ `📦 build(deps): Actualizar la dependencia X a la versión Y.`

_Commit 2:_ `✨ feat(user-auth): Agregar función de recuperación de contraseña.`

#### Documentación

Si tu commit también modifica la documentación (por ejemplo, agregando una característica), incluye los cambios de documentación en el mismo commit. Esto ayuda a mantener la coherencia entre el commit y la documentación del proyecto.

#### Commits WIP

Los commits WIP (Trabajo en Progreso) son para cambios que aún están en desarrollo y no están listos para ser fusionados en la rama principal. En lugar de confirmar cambios WIP y alterar el flujo de trabajo, puedes usar `git stash` para mantenerlos en un estado temporal sin confirmarlos en el historial.

#### Referencias

Siempre que un commit esté relacionado con un issue o ticket, incluye una referencia al mismo en el mensaje del commit. Esto ayuda a mantener un historial claro y facilita el seguimiento de issues.

**Ejemplo:**

```
✨ feat(user-auth): Agregar función de recuperación de contraseña

Cierra #123
```

#### Squash

El término "squash" se refiere a un método para combinar commits. Cuando tienes más de un commit para el mismo propósito, usa este método para reducir el número de commits y mejorar la legibilidad.

Usa `git rebase -i` para hacer squash de los commits.

💡 **Consejo adicional:** Cuando necesites corregir algo en un commit reciente (y antes de hacer push), usa el formato `fixup!` para indicar que estás arreglando o ajustando un commit anterior. Estos commits son útiles antes de realizar un squash.

## 👷 Guía de Pull Request

Por favor, asegúrate de que tu Pull Request cumpla con los siguientes requisitos:

- **Descripción clara:** Explica el propósito de tu contribución y cómo mejora el proyecto.

- **Documentación actualizada:** Si agregas nuevas funcionalidades, actualiza la documentación en consecuencia.

- **Pruebas incluidas:** Si realizas cambios significativos en el código, asegúrate de agregar pruebas para verificar la funcionalidad.

Después de abrir un Pull Request, otros colaboradores pueden revisar tu código y sugerir cambios antes de que sea aceptado.

## 🚧 Pruebas

Es crucial asegurarse de que todos los cambios pasen las pruebas actuales del proyecto. Si tus modificaciones son significativas, debes escribir tus propias pruebas para la funcionalidad que estás implementando.

## 🎩 Estándares

Es esencial seguir los estándares de Kito. Esto incluye el formato de los mensajes de commit, el formato del código, la estructura de carpetas, la documentación, las pruebas y todos los demás aspectos del proyecto.

Sé coherente con el estilo definido y sigue las mejores prácticas.

## 🎉 ¡Gracias!

¡Gracias por leer y esperamos que esta guía te ayude a comenzar a contribuir!
