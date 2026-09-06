const http = require("http");
const path = require("path");
const express = require("express");

function loadPty() {
    try {
        return require("node-pty");
    } catch (err) {
        try {
            return require("@homebridge/node-pty-prebuilt-multiarch");
        } catch (fallbackErr) {
            console.error("Impossible de charger node-pty. Installe les outils de compilation Windows, puis relance npm install.");
            throw err;
        }
    }
}

const pty = loadPty();
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.UI_PORT) || 3456;

const app = express();
const httpServer = http.createServer(app);
const io = require("socket.io")(httpServer);

app.use("/vendor/xterm", express.static(path.join(ROOT, "node_modules", "xterm")));
app.use("/vendor/xterm-addon-fit", express.static(path.join(ROOT, "node_modules", "xterm-addon-fit")));
app.use(express.static(path.join(__dirname, "public")));

let nextId = 1;
let clientCount = 0;
const sessions = new Map();

function publicSession(session) {
    return { id: session.id, type: session.type, name: session.name };
}

function spawnSession(type) {
    const id = String(nextId++);
    const script = type === "server"
        ? path.join(ROOT, "src", "server", "server+.js")
        : path.join(ROOT, "src", "client", "client+.js");
    const name = type === "server" ? "Serveur" : `Client ${++clientCount}`;

    const term = pty.spawn(process.execPath, [script], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd: ROOT,
        env: {
            ...process.env,
            TERM: "xterm-256color",
            FORCE_COLOR: "1",
        },
    });

    const session = { id, type, name, pty: term, buffer: "" };
    sessions.set(id, session);

    term.onData((data) => {
        session.buffer += data;
        if (session.buffer.length > 80000) {
            session.buffer = session.buffer.slice(-60000);
        }
        io.emit("output", { id, data });
    });

    term.onExit(({ exitCode }) => {
        io.emit("exit", { id, exitCode });
        sessions.delete(id);
    });

    return session;
}

function killSession(id) {
    const session = sessions.get(id);
    if (!session) {
        return;
    }
    try {
        session.pty.kill();
    } catch (err) {
        console.error("kill", id, err.message);
    }
}

function stopAllSessions() {
    for (const session of [...sessions.values()]) {
        killSession(session.id);
    }
    nextId = 1;
    clientCount = 0;
}

function ensureChatServer() {
    for (const session of sessions.values()) {
        if (session.type === "server") {
            return session;
        }
    }
    return spawnSession("server");
}

let stopTimer = null;
let browsers = 0;

io.on("connection", (socket) => {
    browsers += 1;
    if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
    }
    ensureChatServer();

    socket.emit("sessions", [...sessions.values()].map((session) => ({
        ...publicSession(session),
        buffer: session.buffer,
    })));

    socket.on("add-client", () => {
        const session = spawnSession("client");
        io.emit("session", { ...publicSession(session), buffer: "" });
    });

    socket.on("input", ({ id, data }) => {
        const session = sessions.get(id);
        if (session && typeof data === "string") {
            session.pty.write(data);
        }
    });

    socket.on("resize", ({ id, cols, rows }) => {
        const session = sessions.get(id);
        if (session && cols > 1 && rows > 1) {
            try {
                session.pty.resize(cols, rows);
            } catch (err) {
                // ignore resize errors while the process exits
            }
        }
    });

    socket.on("kill", ({ id }) => {
        const session = sessions.get(id);
        if (session && session.type === "client") {
            killSession(id);
        }
    });

    socket.on("disconnect", () => {
        browsers = Math.max(0, browsers - 1);
        if (browsers > 0) {
            return;
        }
        stopTimer = setTimeout(() => {
            if (browsers === 0) {
                console.log("Page fermée : arrêt du serveur tchat et des clients.");
                stopAllSessions();
            }
        }, 800);
    });
});

function shutdown() {
    for (const session of sessions.values()) {
        try {
            session.pty.kill();
        } catch (err) {
            // already dead
        }
    }
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

httpServer.listen(PORT, "127.0.0.1", () => {
    console.log(`IHM terminaux : http://127.0.0.1:${PORT}`);
    console.log("Le serveur tchat (8080) démarre à l’ouverture de la page et s’arrête à sa fermeture.");
});
