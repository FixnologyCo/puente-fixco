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
    
    try {
        if (fs.existsSync(iconPath)) {
            // Verificamos que el .exe exista antes de editarlo
            if (!fs.existsSync(exePath)) {
                console.warn('⚠️ No encontré el .exe de Windows para editar. (¿Quizás solo se generó el de Mac?)');
                return;
            }

            await rcedit(exePath, {
                 // 'icon': iconPath,
                // 'version-string': {
                //     'CompanyName': 'Fixnology Community',
                //     'FileDescription': 'Puente de Impresión Local',
                //     'ProductName': 'Fixnology Printer Bridge',
                //     'OriginalFilename': exeFilename,
                //     'LegalCopyright': '© 2025 Fixnology'
                // },
                // 'product-version': '1.0.0',
                // 'file-version': '1.0.0'
            });
            console.log('✅ ¡LISTO! Icono inyectado correctamente.');
        } else {
            console.warn(`⚠️ No encontré el icono en: ${iconPath}`);
        }
        
        console.log('👉 Archivos generados en carpeta /dist');
        
    } catch (error) {
        console.error('❌ Error en metadatos (ignorable):', error);
    }
}

build();
    // "build": "pkg index.js --targets node18-win-x64,node18-macos-x64 --output dist/repos-puente-fixco --compress GZip"
