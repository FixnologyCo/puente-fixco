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
    res.send({ success: true, message: '¡Puente de Impresión Conectado!', device_ip: clientIp });
});

app.post('/imprimir-comanda', async (req, res) => {
    const ticket = req.body;
    const clientIp = getClientIp(req);

    console.log(`[INFO] Imprimiendo para: ${ticket.area_nombre} en IP ${ticket.ip_impresora}`);

    if (!ticket.ip_impresora) {
        return res.status(200).send({ success: true, message: 'Orden recibida, pero sin IP de impresora.' });
    }

    const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: `tcp://${ticket.ip_impresora}:9100`,
        characterSet: CharacterSet.PC850_MULTILINGUAL,
        timeout: 4000
    });

    try {
        // --- ENCABEZADO ---
        printer.alignCenter();
        // Quitamos negrita al área para que sea más sutil
        printer.println(ticket.area_nombre.toUpperCase());

        printer.newLine(); // Espacio

        // Nombre de la MESA en tamaño normal, pero NEGRILLA
        printer.bold(true);
        // Eliminamos el setTextSize(2,2) para que no sea gigante
        printer.println(ticket.mesa.toUpperCase());
        printer.bold(false);

        printer.newLine(); // Espacio
        printer.drawLine(); // Una sola línea separadora fina

        // --- INFO (Consecutivo, Hora, Mesero) ---
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        printer.bold(true);
        printer.alignLeft();
        printer.println(ticket.orden_consecutivo);

        printer.bold(true);
        printer.alignLeft();
        printer.println(time);

        printer.alignLeft();
        printer.println(`Solicita: ${ticket.mesero.toUpperCase()}`);

        printer.drawLine(); // Línea separadora antes de los productos

        // --- LISTA DE ITEMS (Estética Mejorada) ---
        printer.alignLeft();

        for (const item of ticket.items) {
            // MEJORA: Cantidad y Nombre en la MISMA línea
            printer.bold(true);
            printer.println(`${item.cantidad} x ${item.nombre.toUpperCase()}`);
            printer.bold(false);

            // Notas del producto (con indentación simple, sin flechas)
            if (item.notas) {
                // Agregamos unos espacios al inicio para indentar la nota
                printer.println(`>  (${item.notas})`);
            }

            // Usamos un espacio en blanco entre productos en lugar de una línea punteada
            // para que se vea más limpio.
            printer.newLine();
        }

        // --- NOTAS GENERALES Y PIE DE PÁGINA ---
        if (ticket.notas_generales) {
            printer.drawLine(); // Línea antes de notas generales
            printer.bold(true);
            printer.println("NOTAS:");
            printer.bold(false);
            printer.println(ticket.notas_generales.toUpperCase());
        } else {
            // Si no hay notas generales, ponemos una línea final para cerrar el ticket
            printer.drawLine();
        }
        printer.newLine();
        printer.cut();

        await printer.execute();
        console.log(`[SUCCESS] Ticket enviado a ${ticket.ip_impresora}`);
        res.send({ success: true, message: 'Impresión enviada' });

    } catch (error) {
        console.error(`[ERROR] Falló la impresión en ${ticket.ip_impresora}:`, error.message);
        res.status(500).send({ success: false, message: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de Impresión corriendo en http://0.0.0.0:${PORT}`);
});