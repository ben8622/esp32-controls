import { use, useEffect, useState } from 'react';
import '../styles/ControllerPage.css';
import LoggingContainer from '../components/LoggingContainer';

function ControllerPage() {
  const [w, setW] = useState(false);
  const [s, setS] = useState(false);
  const [a, setA] = useState(false);
  const [d, setD] = useState(false);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    readControlValues()
  }, [w, s, a, d]);

  useEffect(() => {
  }, [ws]);

  useEffect(() => {
  }, [connected]);

  function connectWs() {
    const socket: WebSocket = new WebSocket('ws://localhost:3000/connect')
    
    socket.binaryType = 'arraybuffer';

    socket.addEventListener('open', (event) => {
      console.log("Connected to WebSocket server");
      setWs(socket);
      setConnected(true);
      addLog("Connected to WebSocket server");
    });
    socket.addEventListener('close', (event) => {
      console.log("Disconnected from WebSocket server");
      setWs(null);
      setConnected(false);
      addLog("Disconnected from WebSocket server");
    });
    socket.addEventListener('message', (event: MessageEvent) => {
      const buffer: Uint8Array = new Uint8Array(event.data);
      const byteString = `x${buffer[0]}x${buffer[1]}x${buffer[2]}x${buffer[3]}`;
      console.log('Message from server ', byteString);
      addLog(byteString);
    });
    socket.addEventListener('error', (event) => {
      console.error("WebSocket error observed:", event);
      alert("WebSocket error observed. Is the backend server running? Try refreshing the page.");
    });
  }

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, `${timestamp}:  ${message}`];
      if (newLogs.length > 100) {
        newLogs.shift();
      }
      return newLogs;
    });
  }

  function readControlValues() {
    const controlMsg = {
      w: w,
      s: s,
      a: a,
      d: d
    }

    if(ws && ws.readyState === WebSocket.OPEN) {
      console.debug("Sending via WS:", controlMsg);
      ws.send(JSON.stringify(controlMsg));
    }

  }

  function connectButtonHandler() {
    connectWs();
  }

  addEventListener("keyup", (event) => {
    if (event.key === "W" || event.key == "w") {
      setW(false);
    }
    if (event.key === "S" || event.key == "s") {
      setS(false);
    }
    if (event.key === "A" || event.key == "a") {
      setA(false);
    }
    if (event.key === "D" || event.key == "d") {
      setD(false);
    }
   })

  addEventListener("keydown", (event) => {
    if (event.key === "W" || event.key == "w") {
      setW(true);
    }
    if (event.key === "S" || event.key == "s") {
      setS(true);
    }
    if (event.key === "A" || event.key == "a") {
      setA(true);
    }
    if (event.key === "D" || event.key == "d") {
      setD(true);
    }
  })

  return (
    <div className="page">
      <div>
        <div className='wsad-container'>
          <div></div>
          <div className="wsad-container-item" style={{backgroundColor: w ? 'firebrick': 'darkslategray'}}>UP</div>
          <div></div>

          <div className="wsad-container-item" style={{backgroundColor: a ? 'firebrick': 'darkslategray'}}>LEFT</div>
          <div></div>
          <div className="wsad-container-item" style={{backgroundColor: d ? 'firebrick': 'darkslategray'}}>RIGHT</div>

          <div></div>
          <div className="wsad-container-item" style={{backgroundColor: s ? 'firebrick': 'darkslategray'}}>DOWN</div>
          <div></div>
        </div>
        <div>
          <button onClick={connectButtonHandler}>CONNECT TO ESP32</button>
        </div>
      </div>
        <div>
          {{true: <div style={{color: 'lightgreen'}}>Connected to server</div>, false: <div style={{color: 'red'}}>Disconnected from server</div> }[connected]}
          <h2>Logs</h2>
          <LoggingContainer logs={logs}/>
        </div>
    </div>
  );
}

export default ControllerPage;