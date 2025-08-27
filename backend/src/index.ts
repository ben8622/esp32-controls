import dotenv from 'dotenv';
import express from 'express';
import expressWs from 'express-ws';
import { SerialPort } from 'serialport';
import { Request, Response } from 'express';
import Esp32 from './Esp32';
import { WebSocket } from 'ws';

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


function createControlBuffer() {
    // create a a buffer of 4 bytes to hold each control values
    const buffer: Buffer = Buffer.alloc(4);
    // assign all the bytes according to the controls objects
    console.log(`controls: w: ${controls.w}, s: ${controls.s}, a: ${controls.a}, d: ${controls.d}`);
    buffer[0] = controls.w == true ? 1 : 0;
    buffer[1] = controls.s ? 1 : 0;
    buffer[2] = controls.a ? 1 : 0;
    buffer[3] = controls.d ? 1 : 0;
    console.log(`buffer length: ${buffer.length}, bufffer 1 byte value: ${buffer[0]}`);
    return buffer;
}

// Express thin client with websocket 
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
});
app.ws('/connect', (ws: WebSocket, req: Request) => {
    // init ESP32 serial connection
    const esp32 = new Esp32(
        process.env.SERIAL_PORT || '/dev/ttyUSB0',
        Number(process.env.BAUD_RATE) || Number('115200'),
        ws
    );
    const relayMessage = (data: Buffer) => {
            ws.send(data.toString());
    }
    const cannotConnect = (err: Error) => {
        console.error('Serial port error: ', err.message);
        ws.send('Error: Cannot connect to ESP32. Is it connected?');
        ws.close();
    }
    esp32.setDataCallback(relayMessage);
    esp32.setErrorCallback(cannotConnect);


    // setup timeoutInterval functions to send data to ESP32
    setInterval(() => {
        esp32.sendToSerialPort(createControlBuffer());
    }, 1000);

    // map incoming changes to controls object
    ws.on('message', (msg: string) => {
        const msgJson = JSON.parse(msg);
        console.log('Controls JSON before spread:', controls);
        controls = { ...msgJson }
        console.log('Controls JSON after spread:', controls);
    });
    // reset controls on disconnect to base values
    ws.on('close', () => {
        console.log('WebSocket was closed');
        controls = { ...controlsBase };
        esp32.sp.close();
    });

});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});


