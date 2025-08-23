import dotenv from 'dotenv';
import express from 'express';
import expressWs from 'express-ws';
import { Request, Response } from 'express';

// 
dotenv.config({ path: '../.env' })

// init express app & websockets
const expressServer = express();
const wsServer = expressWs(expressServer);
const app = wsServer.app
const port: number = 3000;

let controls = {
    w: false,
    s: false,
    a: false,
    d: false
}

// TODO init serial connection to ESP32
// TODO add function to read controls states and relay to ESP32
// TODO add function to read from ESP32 and relay to websocket

// Express thin client with websocket 
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
});
app.ws('/connect', (ws: any, req: Request) => {
    // on message received event
    ws.on('message', (msg: string) => {
        const msgJson = JSON.parse(msg);
        controls = { ...msgJson }
    });
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

setInterval(() => {
    // print current control states
    console.log('Current controls:', controls);
    // TODO send the current control states to the ESP32
}, 2000);