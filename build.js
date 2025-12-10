const { execSync } = require('child_process');
const rcedit = require('rcedit');
const path = require('path');
const fs = require('fs');

async function build() {
    console.log('🚀 Iniciando construcción PROFESIONAL de Fixnology Bridge...');

    // Rutas absolutas
    const iconPath = path.resolve(__dirname, 'icon/logo.ico');
    
    // NOTA: Al compilar para varios targets, PKG añade sufijos automáticamente.
    // Nosotros definimos el nombre base.
    const outputBase = path.resolve(__dirname, 'dist/PuenteRePOS'); 

    // 1. Limpieza
    if (fs.existsSync('dist')) {
        try { fs.rmSync('dist', { recursive: true, force: true }); } catch (e) { }
    }

    // 2. EMPAQUETADO BLINDADO
    try {
        console.log('📦 Creando ejecutables (Windows + Mac)...');
        
        // CAMBIOS CRÍTICOS APLICADOS:
        // 1. --scripts: OBLIGATORIO para que funcione la impresora.
        // 2. --no-bytecode: Para evitar errores de lectura.
        // 3. SIN COMPRESS: Para que no se cierre solo.
        
        const cmd = 'pkg index.js ' +
            '--targets node18-win-x64,node18-macos-x64 ' +
            '--output "' + outputBase + '" ' +
            '--scripts "node_modules/node-thermal-printer/interfaces/*.js" ' + 
            '--public ' +
            '--no-bytecode'; // <-- IMPORTANTE: Usamos esto en vez de GZip

        execSync(cmd, { stdio: 'inherit' });
        
    } catch (e) {
        console.error('❌ Error al empaquetar con PKG:', e);
        return;
    }

    // 3. Pausa de seguridad
    console.log('⏳ Esperando liberación de archivos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Inyección de Icono (SOLO EN WINDOWS)
    // PKG genera "PuenteRePOSFixCO-win.exe" cuando hay múltiples targets
    const winExePath = outputBase + '-win.exe';

    // if (fs.existsSync(winExePath)) {
    //     console.log('🎨 Inyectando icono en versión Windows...');
    //     try {
    //         await rcedit(winExePath, {
    //             'icon': iconPath,
    //             // 'version-string': {
    //             //     'CompanyName': 'Fixnology CO.',
    //             //     'FileDescription': 'Puente de Impresión Local',
    //             //     'ProductName': 'Fixnology Bridge',
    //             //     'OriginalFilename': 'PuenteRePOSFixCO-win.exe'
    //             // },
    //             // 'product-version': '1.0.0'
    //         });
    //         console.log('✅ Windows: Icono inyectado correctamente.');
    //     } catch (error) {
    //         console.error('⚠️ No se pudo inyectar icono (¿tienes rcedit instalado?):', error);
    //     }
    // }

    console.log('✅ ¡PROCESO TERMINADO!');
    console.log('👉 Archivos en la carpeta /dist');
}

build();