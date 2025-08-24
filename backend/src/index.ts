import dotenv from 'dotenv';
import express from 'express';
import expressWs from 'express-ws';
import { SerialPort } from 'serialport';
import { Request, Response } from 'express';
import { send } from 'process';

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

// TODO add function to read from ESP32 and relay to websocket

let serialPort: SerialPort;
function initSerialPort (){
    const serialPortPath = process.env.SERIAL_PORT || '/dev/ttyUSB0';
    const baudRate = parseInt(process.env.BAUD_RATE || '115200');
    serialPort = new SerialPort({
        path: serialPortPath,
        baudRate: baudRate,
    });
    serialPort.on('open', () => {
        console.log('Serial port opened.');
    });
    serialPort.on('error', (err) => {
        console.error('Error: ', err.message);
    });
    serialPort.on('close', () => {
        console.log('Serial port closed.');
    });
    serialPort.on('data', (data) => {
        console.log('Data from ESP32: ', data.toString());
    });
};
function sendToSerialPort(data: string) {
    if (serialPort && serialPort.isOpen) {
        serialPort.write(data, (err) => {
            if (err) {
                return console.error('Error on write: ', err.message);
            }
            console.log('Message sent to ESP32: ', data);
        });
    }
};
initSerialPort();

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
    sendToSerialPort(JSON.stringify(controls));
}, 1000);
setInterval(() => {
    // if the serial port is not open, try to reopen it
    if (serialPort && !serialPort.isOpen) {
        console.log('Serial port not open. Attempting to reopen...');
        initSerialPort();
    }
}, 10000)