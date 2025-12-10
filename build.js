const { execSync } = require('child_process');
const rcedit = require('rcedit');
const path = require('path');
const fs = require('fs');

async function build() {
    console.log('🚀 Iniciando construcción PROFESIONAL de Fixnology Bridge...');

    const iconPath = path.resolve(__dirname, 'icon/logo.ico');
    const exePath = path.resolve(__dirname, 'dist/PuenteRePOSFixCO.exe');
    
    
    // 1. Limpieza
    if (fs.existsSync('dist')) {
        try { fs.rmSync('dist', { recursive: true, force: true }); } catch (e) { }
    }


   
    // 3. Empaquetado con PKG (CORREGIDO)
    try {
        console.log('📦 Creando ejecutable .EXE desde el compilado...');
        
        // CAMBIO IMPORTANTE:
        // 1. Quitamos "--config package.json" para evitar conflictos de rutas.
        // 2. Agregamos "--targets node18-win-x64" directamente aquí.
        // 3. Agregamos "--public" para asegurar que assets internos se lean bien si ncc los incluyó.
        
        execSync('pkg index.js --targets node18-win-x64,node18-macos-x64 --output dist/PuenteRePOSFixCO --compress GZip', { stdio: 'inherit' });
        
    } catch (e) {
        console.error('❌ Error al empaquetar con PKG:', e);
        return;
    }


    // 4. Pausa de seguridad
    console.log('⏳ Esperando liberación del archivo...');
    await new Promise(resolve => setTimeout(resolve, 2000));

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