import '../styles/LoggingContainer.css';

function LoggingContainer({logs}: {logs: string[]}) {
  return (
    <div>
        <div className="logging-container">
            {logs.map((log, index) => (
                <div className="logging-item" key={index}>{log}</div>
            ))}
        </div>
    </div>
);
}

export default LoggingContainer;