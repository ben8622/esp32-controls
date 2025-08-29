# esp32-controls
React web UI and nodejs backend used to communicate to a esp32 over serial.

## High Level Flow
1. User enters the frontend controls page
2. User connects to backend via websocket
3. Backend connects to SerialPort the ESP32 transmitter is using with UART
4. ESP32 transmitter connects to ESP32 receiver using ESPNOW
5. Messages flow from the backend to the ESP32 receiver through the connections above on a repeating time interval (i.e. 1 second)
6. Frontend can change the messages based on client side actions such as a button press
