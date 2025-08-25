import dotenv from 'dotenv';
import express from 'express';
import expressWs from 'express-ws';
import { SerialPort } from 'serialport';
import { Request, Response } from 'express';
import Esp32 from './Esp32';

// 
dotenv.config({ path: '../.env' })

// init express app & websockets
const expressServer = express();
const wsServer = expressWs(expressServer);
const app = wsServer.app
const port: number = 3000;

const controlsBase = {
    w: false,
    s: false,
    a: false,
    d: false
}
let controls = {
    w: false,
    s: false,
    a: false,
    d: false
}

// init ESP32 serial connection
const esp32 = new Esp32(
    process.env.SERIAL_PORT || '/dev/ttyUSB0',
    Number(process.env.BAUD_RATE) || Number('115200')
);
function createControlBuffer() {
    // create a a buffer of 4 bytes to hold each control values
    const buffer: Buffer = Buffer.alloc(4);
    // assign all the bytes according to the controls objects
    buffer[0] = controls.w ? 1 : 0;
    buffer[1] = controls.s ? 1 : 0;
    buffer[2] = controls.a ? 1 : 0;
    buffer[3] = controls.d ? 1 : 0;
    return buffer;
}

// Express thin client with websocket 
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
});
app.ws('/connect', (ws: any, req: Request) => {
    // map incoming changes to controls object
    ws.on('message', (msg: string) => {
        const msgJson = JSON.parse(msg);
        controls = { ...msgJson }
    });
    // reset controls on disconnect to base values
    ws.on('close', () => {
        console.log('WebSocket was closed');
        controls = { ...controlsBase };
    });
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

setInterval(() => {
    esp32.sendToSerialPort(createControlBuffer());
}, 1000);
setInterval(() => {
    // if the serial port is not open, try to reopen it
    if (esp32.sp && !esp32.sp.isOpen) {
        console.log('Serial port not open. Attempting to reopen...');
        esp32.initSerialPort();
    }
}, 10000)