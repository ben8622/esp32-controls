import { use, useEffect, useState } from 'react';
import '../styles/ControllerPage.css';
import LoggingContainer from '../components/LoggingContainer';

function ControllerPage() {
  const [w, setW] = useState(false);
  const [s, setS] = useState(false);
  const [a, setA] = useState(false);
  const [d, setD] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  function connectWs() {
    const socket: WebSocket = new WebSocket('ws://localhost:3000/connect')

    socket.addEventListener('open', (event) => {
      console.log("Connected to WebSocket server");
      addLog("Connected to WebSocket server");
    });
    socket.addEventListener('close', (event) => {
      console.log("Disconnected from WebSocket server");
      setWs(null);
    });
    socket.addEventListener('message', (event: MessageEvent) => {
      console.log(`Message type: ${ws?.binaryType} | message: ${event.data}`);
      console.log('Message from server ', event.data);
      addLog(event.data);
    });
    socket.addEventListener('error', (event) => {
      console.error("WebSocket error observed:", event);
      alert("WebSocket error observed. Is the backend server running? Try refreshing the page.");
    });
    setWs(socket);
  }

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    // const currLogs: string[] = logs;
    // const newLogs = [...currLogs, `${timestamp}:  ${message}`];
    // if (newLogs.length > 100) {
    //   newLogs.shift();
    // }
    // setLogs(newLogs);
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, `${timestamp}:  ${message}`];
      if (newLogs.length > 100) {
        newLogs.shift();
      }
      return newLogs;
    });
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

  function readControlValues() {
    const controlMsg = {
      up: w,
      down: s,
      left: a,
      right: d
    }

    if(ws && ws.readyState === WebSocket.OPEN) {
      console.debug("Sending via WS:", controlMsg);
      ws.send(JSON.stringify(controlMsg));
    }

  }

  useEffect(() => {
    readControlValues()
  }, [w, s, a, d]);

  useEffect(() => {
    connectWs();
  }, []);

  useEffect(() => {
  }, [ws]);

  return (
    <div className="page">
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
          <h2>Logs</h2>
          <LoggingContainer logs={logs}/>
        </div>
    </div>
  );
}

export default ControllerPage;