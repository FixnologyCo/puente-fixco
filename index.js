const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 4000;

const getClientIp = (req) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7);
    }
    return ip;
};

app.get('/health', (req, res) => {
    const clientIp = getClientIp(req);
    console.log(`[INFO] Ping recibido desde el Dispositivo/POS. IP: ${clientIp}`);
    
    res.send({
        success: true,
        message: '¡Puente de Impresión Conectado y Listo!',
        device_ip: clientIp
    });
});

app.post('/imprimir-comanda', async (req, res) => {
    const ticket = req.body;
    const clientIp = getClientIp(req);

    console.log('--- ⬇️ DATOS DE COMANDA RECIBIDOS ⬇️ ---');
    console.log(`Origen: ${clientIp}`);
    console.log('--- ⬆️ FIN DE DATOS DE COMANDA ⬆️ ---');

    if (!ticket.ip_impresora) {
        console.warn(`[WARN] Se recibió trabajo sin IP para ${ticket.area_nombre}`);
        return res.status(200).send({ success: true, message: 'Orden recibida, pero esta área no tiene IP de impresora.' });
    }

    console.log(`[INFO] Imprimiendo para: ${ticket.area_nombre} en IP ${ticket.ip_impresora}`);

    const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: `tcp://${ticket.ip_impresora}:9100`,
        characterSet: CharacterSet.PC850_MULTILINGUAL,
        timeout: 4000
    });

    try {
        // 1. Título del Área (Compacto)
        printer.alignCenter();
        printer.bold(true);
        printer.println(ticket.area_nombre.toUpperCase()); 
        printer.bold(false);
        // Eliminado newLine aquí para ahorrar espacio

        // 2. Título Principal (Mesa)
        printer.drawLine();
        printer.setTextSize(2, 2);
        printer.bold(true);
        printer.println(ticket.mesa.toUpperCase());
        printer.setTextSize(1, 1);
        printer.bold(false);
        printer.drawLine();

        // 3. Información de la Orden
        const now = new Date();
        const time = now.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Imprime la tabla sin saltos extra antes
        printer.tableCustom([
            { text: ticket.orden_consecutivo, align: "LEFT", width: 0.40 },
            { text: time, align: "CENTER", width: 0.20, style: "B" },
            { text: ticket.mesero, align: "RIGHT", width: 0.40 }
        ]);
        
        // Pequeño espacio antes de los items para que no se pegue al encabezado
        printer.newLine(); 

        // 5. Tabla de Items (SUPER COMPACTA)
        for (const item of ticket.items) {
            printer.alignLeft();
            printer.bold(true);
            // Imprime el producto
            printer.println(`${item.cantidad}x ${item.nombre.toUpperCase()}`);
            printer.bold(false);

            // Si hay notas, las imprime debajo
            if (item.notas) {
                printer.println(`  -> ${item.notas}`);
            }
        }

        // Notas Generales (con un pequeño separador si existen)
        if (ticket.notas_generales) {
            printer.newLine();
            printer.drawLine();
            printer.bold(true);
            printer.println("NOTA GRAL:");
            printer.bold(false);
            printer.println(ticket.notas_generales);
        }

        // Espacio final para poder cortar bien
        printer.newLine();
        printer.newLine();
        printer.cut();

        await printer.execute();

        console.log(`[SUCCESS] Ticket ${ticket.orden_consecutivo} enviado a ${ticket.ip_impresora}`);
        res.send({ success: true, message: 'Impresión enviada' });

    } catch (error) {
        console.error(`[ERROR] Falló la impresión en ${ticket.ip_impresora}:`, error.message);
        res.status(500).send({ success: false, message: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Impresión (Puente) corriendo en http://0.0.0.0:${PORT}`);
});