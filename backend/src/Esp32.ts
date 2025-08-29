import { SerialPort } from 'serialport';
import { WebSocket } from 'ws';

class Esp32 {
    sp: SerialPort;
    ws: WebSocket;
    serialPath: string;
    baudRate: number;

    constructor(serialPath: string, baudRate: number, ws: WebSocket) {
        this.serialPath  = serialPath;
        this.baudRate = baudRate;
        this.ws = ws;
        this.sp = this.initSerialPort();
    }

    initSerialPort(): SerialPort {
        // init the SerialPort with AutoOpen false so we can register all event listeners first
        const sp: SerialPort = new SerialPort({
                path: this.serialPath,
                baudRate: this.baudRate,
                autoOpen: false,
        });

        // register event listeners
        sp.on('open', () => {
            console.log('Serial port opened.');
        });
        sp.on('error', (err) => {
            console.error('Error: ', err.message);
        });
        sp.on('close', () => {
            console.log('Serial port closed.');
            sp.destroy();
            this.ws.close();
        });
        // sp.on('data', (data) => {
        //     console.log('Data from ESP32: ', data);
        // });     

        // open the serial port after regstering event listeners
        sp.open((err) => {
            // if we error out opening the port, notify the websocket and close it
            if (err) {
                console.error('Error opening serial port: ', err.message);
                this.ws.send('Error: Cannot connect to ESP32. Is it connected?');
                this.ws.close();
            }
        });

        // assign the serial port instance to the class property
        this.sp = sp;
        return this.sp;
    }

    sendToSerialPort(data: Buffer) {
        if (this.sp && this.sp.isOpen) {
            this.sp.write(data, (err) => {
                if (err) {
                    return console.error('Error on write: ', err.message);
                }
                console.log('Message sent to ESP32: ', data);
            });
        }
    }

    setDataCallback(callback: (data: Buffer) => void) {
        this.sp.on('data', callback);
    }

    setErrorCallback(callback: (err: Error) => void) {
        this.sp.on('error', callback);
    }
}

export default Esp32;