import * as signalR from "@microsoft/signalr";

let connection = null;
let startPromise = null;

export function getConnection() {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${import.meta.env.VITE_API_URL}/hubs/chat`, {
      accessTokenFactory: () => {
        const u = JSON.parse(localStorage.getItem("novacare_user") || "null");
        return u?.token ?? "";
      },
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.onclose(() => {
    connection = null;
    startPromise = null;
  });

  return connection;
}

/** Wait until the connection is actually Connected before returning it. */
export function startConnection() {
  if (startPromise) return startPromise;

  const conn = getConnection();

  if (conn.state === signalR.HubConnectionState.Connected) {
    return Promise.resolve(conn);
  }

  startPromise = new Promise((resolve, reject) => {
    const check = () => {
      if (conn.state === signalR.HubConnectionState.Connected) {
        startPromise = null;
        resolve(conn);
        return;
      }
      if (conn.state === signalR.HubConnectionState.Disconnected) {
        conn
          .start()
          .then(() => {
            startPromise = null;
            resolve(conn);
          })
          .catch((err) => {
            startPromise = null;
            reject(err);
          });
        return;
      }
      // Connecting or Reconnecting — poll briefly until ready
      setTimeout(check, 100);
    };
    check();
  });

  return startPromise;
}

export async function stopConnection() {
  if (
    connection &&
    connection.state !== signalR.HubConnectionState.Disconnected
  ) {
    await connection.stop();
  }
  connection = null;
  startPromise = null;
}
