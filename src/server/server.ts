import ServerManager from "./inc/Server";

const server = new ServerManager();

server.start(Number(process.env.SERVER_PORT) || 3070);