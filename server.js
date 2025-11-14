const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 4000;

app.get('/health', (req, res) => {
    console.log('[INFO] Ping recibido desde la Tablet/POS.');
    res.send({
        success: true,
        message: '¡Puente de Impresión Conectado y Listo! MELOSOOOOO'
    });
});

app.post('/imprimir-comanda', async (req, res) => {
    const ticket = req.body;

    console.log('--- ⬇️ DATOS DE COMANDA RECIBIDOS ⬇️ ---');
    console.log(JSON.stringify(ticket, null, 2));
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
        // 1. Título del Área
        printer.alignCenter();
        printer.bold(true);
        printer.println(ticket.area_nombre.toUpperCase()); // "COCINA" [cite: 1]
        printer.bold(false);
        printer.newLine();

        // 2. Título Principal (Mesa / Tipo Orden)
        // El PDF [cite: 2] muestra "MESA: M-10".
        printer.drawLine();
        printer.setTextSize(2, 2);
        printer.bold(true);
        printer.println(ticket.mesa.toUpperCase()); // "MESA: M-10" [cite: 2]
        printer.setTextSize(1, 1);
        printer.bold(false);
        printer.drawLine();

        // 3. Información de la Orden (Consecutivo, Hora, Mesero) 
        const now = new Date();

        // ✅ MODIFICACIÓN: Añadidos segundos para coincidir con "16:48:22" 
        const time = now.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        printer.tableCustom([
            { text: ticket.orden_consecutivo, align: "LEFT", width: 0.40 }, // "#FV-13112025-8"
            { text: time, align: "CENTER", width: 0.20, style: "B" }, // "16:48:22"
            { text: ticket.mesero, align: "RIGHT", width: 0.40 } // "Ranses"
        ]);

        // 4. Divisor (ELIMINADO)
        // El ticket de muestra [cite: 4, 6] no tiene un divisor aquí
        printer.newLine();
        // printer.drawLine(); // <-- ELIMINADO

        // 5. Tabla de Items
        for (const item of ticket.items) {
            // ✅ MODIFICACIÓN: Formato "1x PRODUCTO" [cite: 4, 5, 6, 8]
            printer.alignLeft(); // Aseguramos alineación
            printer.bold(true);
            printer.println(`${item.cantidad}x ${item.nombre.toUpperCase()}`);
            printer.bold(false);

            // ✅ MODIFICACIÓN: Notas "-> " 
            if (item.notas) {
                printer.alignLeft();
                printer.println(`  -> ${item.notas}`);
            }

            // ✅ MODIFICACIÓN: Separador "----" ELIMINADO
            // El ticket de muestra no tiene separadores entre items
            printer.newLine(); // Dejamos solo un espacio
        }

        // Notas Generales (se mantiene igual)
        if (ticket.notas_generales) {
            printer.newLine();
            printer.drawLine();
            printer.println(ticket.notas_generales);
            printer.drawLine();
        }

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