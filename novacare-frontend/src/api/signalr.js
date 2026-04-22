import * as signalR from '@microsoft/signalr';

let connection = null;
let startingPromise = null;

export const getConnection = () => connection;

export const startConnection = async (token) => {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  if (startingPromise) {
    return startingPromise;
  }

  startingPromise = (async () => {
    try {
      connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5232/hubs/chat', {
          accessTokenFactory: () => token,
          withCredentials: true
        })
        .withAutomaticReconnect()
        .build();

      await connection.start();
      startingPromise = null;
      return connection;
    } catch (err) {
      console.error('SignalR connection error:', err);
      startingPromise = null;
      throw err;
    }
  })();

  return startingPromise;
};

export const stopConnection = async () => {
  if (connection) {
    await connection.stop();
    connection = null;
  }
};
