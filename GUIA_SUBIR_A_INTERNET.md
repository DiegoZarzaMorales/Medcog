# 🚀 Guía Completa para Subir MEDCOG a Internet

## 📋 Tabla de Contenidos
1. [Preparación](#preparación)
2. [GitHub Pages (Recomendado)](#github-pages)
3. [Netlify (Más Fácil)](#netlify)
4. [Otras Opciones](#otras-opciones)

---

## Preparación

### ✅ Checklist Antes de Subir

- [ ] Verificar que todos los archivos existen
- [ ] Comprobar que las imágenes cargan correctamente
- [ ] Probar el sitio localmente
- [ ] Verificar que no hay errores en la consola del navegador (F12)

### 📁 Estructura de Archivos

Tu proyecto debe tener esta estructura:

```
LyA2_DZyM/
├── index.html (✅ YA CREADO - redirige a ProgramaPrincipal)
├── README.md (✅ YA CREADO)
├── .gitignore (✅ YA CREADO)
├── Imagenes/
│   └── medcog_logo.png
├── ProgramaPrincipal/
│   ├── index.html
│   ├── script.js
│   └── styles.css
└── Analizador/
    ├── analyzer.html
    ├── analyzer.js
    └── analyzer.css
```

---

## GitHub Pages (⭐ RECOMENDADO)

### Paso 1: Instalar Git

1. Descarga Git desde: https://git-scm.com/download/win
2. Instala con opciones por defecto
3. Verifica instalación abriendo PowerShell:
   ```powershell
   git --version
   ```

### Paso 2: Crear Cuenta en GitHub

1. Ve a https://github.com
2. Haz clic en "Sign up"
3. Completa el formulario
4. Verifica tu email

### Paso 3: Crear Repositorio en GitHub

1. Inicia sesión en GitHub
2. Haz clic en el botón "+" arriba a la derecha
3. Selecciona "New repository"
4. Configura:
   - **Repository name**: `medcog` (o el nombre que quieras)
   - **Description**: "Sistema de Traductor de Medicamentos con Analizador"
   - **Public** (debe ser público para GitHub Pages gratis)
   - ❌ NO marques "Add a README" (ya lo tienes)
5. Haz clic en "Create repository"

### Paso 4: Subir tu Proyecto

Abre PowerShell en Windows y ejecuta estos comandos:

```powershell
# Navega a tu proyecto
cd "C:\Users\josez\Documents\LyA2_DZyM"

# Inicializa Git
git init

# Configura tu información (usa tus datos de GitHub)
git config user.name "Tu Nombre"
git config user.email "tu-email@ejemplo.com"

# Agrega todos los archivos
git add .

# Haz el primer commit
git commit -m "🎉 Primer commit - MEDCOG v2.5"

# Conecta con GitHub (REEMPLAZA "TU-USUARIO" con tu usuario de GitHub)
git remote add origin https://github.com/TU-USUARIO/medcog.git

# Cambia a la rama main
git branch -M main

# Sube los archivos
git push -u origin main
```

**⚠️ Importante:** 
- Si te pide credenciales, usa tu usuario de GitHub
- Para la contraseña, necesitas crear un **Personal Access Token**:
  1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Generate new token
  3. Selecciona "repo" scope
  4. Copia el token y úsalo como contraseña

### Paso 5: Activar GitHub Pages

1. Ve a tu repositorio en GitHub: `https://github.com/TU-USUARIO/medcog`
2. Haz clic en **Settings** (⚙️)
3. En el menú lateral, haz clic en **Pages**
4. En "Source":
   - Branch: **main**
   - Folder: **/ (root)**
5. Haz clic en **Save**
6. Espera 1-2 minutos

### Paso 6: Ver tu Sitio

Tu sitio estará disponible en:

```
https://TU-USUARIO.github.io/medcog/
```

Por ejemplo: `https://josezamora.github.io/medcog/`

### 🔄 Actualizar tu Sitio

Cada vez que hagas cambios:

```powershell
cd "C:\Users\josez\Documents\LyA2_DZyM"
git add .
git commit -m "✨ Descripción de los cambios"
git push
```

Los cambios aparecerán en 1-2 minutos.

---

## Netlify (🌟 MÁS FÁCIL)

### Método 1: Drag & Drop (Sin Git)

1. Ve a https://netlify.com
2. Haz clic en "Sign up" (puedes usar tu email o GitHub)
3. Una vez dentro, haz clic en "Add new site" → "Deploy manually"
4. **Arrastra la carpeta completa** `LyA2_DZyM` a la ventana
5. ¡Listo! Netlify te dará una URL tipo: `https://random-name-123.netlify.app`

### Método 2: Desde GitHub (Recomendado)

1. Primero sube tu proyecto a GitHub (ver pasos arriba)
2. Ve a https://netlify.com
3. "Add new site" → "Import an existing project"
4. Conecta con GitHub
5. Selecciona tu repositorio `medcog`
6. Configuración:
   - **Branch to deploy**: main
   - **Base directory**: (dejar vacío)
   - **Build command**: (dejar vacío)
   - **Publish directory**: (dejar vacío o poner `/`)
7. "Deploy site"

### Personalizar Dominio en Netlify

1. En tu sitio en Netlify, ve a "Site settings"
2. "Change site name"
3. Elige un nombre: `medcog-tuapellido`
4. Tu URL será: `https://medcog-tuapellido.netlify.app`

---

## Otras Opciones

### Vercel

Similar a Netlify:

1. https://vercel.com
2. "New Project"
3. Importa desde GitHub
4. Deploy automático

**URL**: `https://medcog.vercel.app`

### Firebase Hosting

```powershell
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar proyecto
cd "C:\Users\josez\Documents\LyA2_DZyM"
firebase init hosting

# Configurar:
# - Public directory: . (punto)
# - Single-page app: No
# - Overwrite files: No

# Desplegar
firebase deploy
```

**URL**: `https://tu-proyecto.web.app`

---

## 🎯 Recomendación Final

Para un proyecto como el tuyo, te recomiendo:

**Opción 1 (Profesional)**: GitHub + Netlify
- Sube a GitHub (control de versiones)
- Conecta con Netlify (deploy automático)
- Beneficios: Fácil de actualizar, dominio personalizado, SSL gratis

**Opción 2 (Más Rápida)**: Solo Netlify
- Arrastra y suelta
- Listo en 2 minutos
- Beneficio: Velocidad

**Opción 3 (Aprendizaje)**: GitHub Pages
- Aprende Git/GitHub
- Gratis para siempre
- Beneficio: Portafolio profesional

---

## 🔧 Solución de Problemas

### "Las imágenes no cargan"

En `ProgramaPrincipal/index.html`, verifica que las rutas sean:
```html
<img src="../Imagenes/medcog_logo.png" />
```

En `Analizador/analyzer.html`:
```html
<img src="../Imagenes/medcog_logo.png" />
```

### "El CSS no se aplica"

- Limpia caché del navegador (Ctrl+Shift+Del)
- Espera 1-2 minutos después de hacer push
- Verifica que los archivos `.css` estén en GitHub

### "Git me pide credenciales"

Usa Personal Access Token:
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Scope: "repo"
5. Úsalo como contraseña

---

## 📧 Compartir tu Proyecto

Una vez publicado, puedes compartir:

```
🌐 Sitio web: https://tu-usuario.github.io/medcog/
💻 Código fuente: https://github.com/tu-usuario/medcog
```

---

## 🎉 ¡Felicidades!

Tu proyecto ya está en internet. Ahora puedes:

- Compartirlo en tu CV
- Enviarlo a profesores
- Mostrarlo en entrevistas
- Agregarlo a tu portafolio

**"Tecnología al servicio de tu bienestar."**
