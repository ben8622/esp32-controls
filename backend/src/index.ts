const express = require('express');
import { Request, Response } from 'express';

// init express app
const app = express();
const port: number = 3000;

// init express with websockets
const expressWs = require('express-ws')(app);


app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
});

app.ws('/connect', (ws: any, req: Request) => {
    // on message received event
    ws.on('message', (msg: string) => {
        console.log('message received: ' + msg);
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});