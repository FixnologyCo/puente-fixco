const { execSync } = require('child_process');
const rcedit = require('rcedit');
const path = require('path');
const fs = require('fs');

async function build() {
    console.log('🚀 Iniciando construcción...');

    // 1. Definimos las rutas exactas
    // Asegúrate que tu icono esté en esta carpeta:
    const iconPath = path.resolve(__dirname, 'icon/logo.ico'); 
    
    // Como tu output es "dist/repos-puente-fixco", PKG creará "repos-puente-fixco.exe" en Windows
    const exePath = path.resolve(__dirname, 'dist/repos-puente-fixco.exe');

    // Limpieza previa (opcional, para evitar errores)
    if (fs.existsSync('dist')) {
        try { fs.rmSync('dist', { recursive: true, force: true }); } catch(e) {}
    }
    fs.mkdirSync('dist');

    // 2. EJECUTAMOS TU COMANDO EXACTO
    try {
        console.log('📦 Ejecutando comando PKG...');
        execSync('pkg index.js --targets node18-win-x64,node18-macos-x64 --output dist/repos-puente-fixco --compress GZip', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ Error en el comando PKG:', e);
        return;
    }

    // 3. PAUSA DE SEGURIDAD (Vital para que no salga error de "Unable to commit")
    console.log('⏳ Esperando 3 segundos para liberar el archivo...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. TU CÓDIGO DE RCEDIT (Aplicado solo al .exe)
    console.log('🎨 Inyectando metadatos...');
    
   // 5. Maquillaje final (Icono y Datos)
    console.log('🎨 Inyectando icono y metadatos...');

    try {
        // Verificamos que el icono exista antes de intentar inyectarlo
        if (fs.existsSync(iconPath)) {
            await rcedit(exePath, {
                'icon': iconPath,
                'version-string': {
                    'CompanyName': 'Fixnology Community',
                    'FileDescription': 'Puente de Impresión Local',
                    'LegalCopyright': '© 2025 Fixnology CO.',
                    'ProductName': 'Fixnology Printer Bridge',
                    'OriginalFilename': 'PuenteRePOSFixCO.exe'
                },
                'file-version': '1.0.0',
                'product-version': '1.0.0'
            });
        } else {
            console.warn('⚠️ No se encontró el icono en:', iconPath, '- Se omitió este paso.');
        }

        // Limpieza final
        try { fs.rmSync('build_temp', { recursive: true, force: true }); } catch (e) { }

        console.log('✅ ¡ÉXITO TOTAL!');
        console.log('👉 Tu ejecutable está listo en: ' + exePath);
    } catch (error) {
        console.error('❌ Error al inyectar metadatos (pero el .exe funciona):', error);
    }
}

build();
    // "build": "pkg index.js --targets node18-win-x64,node18-macos-x64 --output dist/repos-puente-fixco --compress GZip"
