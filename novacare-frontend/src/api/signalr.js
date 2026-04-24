import * as signalR from '@microsoft/signalr';

let connection = null;
let startingPromise = null; // prevent concurrent start() calls

export function getConnection() {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${import.meta.env.VITE_API_URL}/hubs/chat`, {
      accessTokenFactory: () => {
        const u = JSON.parse(localStorage.getItem('novacare_user') || 'null');
        return u?.token ?? '';
      },
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  // Reset the singleton if the hub permanently disconnects
  connection.onclose(() => {
    connection = null;
    startingPromise = null;
  });

  return connection;
}

export function startConnection() {
  // If already starting, return the same promise — prevents double-start
  if (startingPromise) return startingPromise;

  const conn = getConnection();

  if (conn.state === signalR.HubConnectionState.Connected) {
    return Promise.resolve(conn);
  }

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    startingPromise = conn.start()
      .then(() => { startingPromise = null; return conn; })
      .catch((err) => { startingPromise = null; throw err; });
    return startingPromise;
  }

  // Connecting or Reconnecting — just return the connection, hub will be ready soon
  return Promise.resolve(conn);
}

export async function stopConnection() {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop();
  }
  connection = null;
  startingPromise = null;
}
