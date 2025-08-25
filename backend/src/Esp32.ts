import { SerialPort } from 'serialport';

class Esp32 {
    sp: SerialPort;
    serialPath: string;
    baudRate: number;

    constructor(serialPath: string, baudRate: number) {
        this.serialPath  = serialPath;
        this.baudRate = baudRate;
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
        });
        sp.on('data', (data) => {
            console.log('Data from ESP32: ', data.toString());
        });

        

        // open the serial port after regstering event listeners
        sp.open((err) => {
            if (err) {
                return console.error('Error opening serial port: ', err.message);
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
}

export default Esp32;