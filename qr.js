const app = express();
const pino = require("pino");
const { toBuffer } = require("qrcode");
const fs = require("fs-extra");
const path = require("path");
const { Boom } = require("@hapi/boom");
const PORT = process.env.PORT || 5000;

const {
  default: WasiWASocket,
  useMultiFileAuthState,
  Browsers,
  delay,
  DisconnectReason,
  makeInMemoryStore,
} = require("@whiskeysockets/baileys");

let sessionStatus = {
  connection: "unknown",
  lastDisconnect: null,
  sessionId: null,
};

if (fs.existsSync("./auth_info_baileys")) {
  fs.emptyDirSync(path.resolve(__dirname, "./auth_info_baileys"));
}

app.use("/", async (req, res) => {
  const store = makeInMemoryStore({
    logger: pino().child({ level: "silent", stream: "store" }),
  });

  async function WASI() {
    const { state, saveCreds } = await useMultiFileAuthState(
      path.resolve(__dirname, "./auth_info_baileys")
    );
    try {
      let Smd = WasiWASocket({
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: [Browsers.Chrome, "Windows 10", "Chrome/89.0.4389.82"],
        auth: state,
      });

      Smd.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect, qr } = s;

        sessionStatus.connection = connection;
        sessionStatus.lastDisconnect = lastDisconnect || null;

        if (connection === "open") {
          try {
            let creds = fs.readFileSync(
              path.resolve(__dirname, "./auth_info_baileys/creds.json")
            );
            sessionStatus.sessionId = Buffer.from(creds).toString("base64");
          } catch (e) {
            sessionStatus.sessionId = null;
          }
        }

        if (qr) {
          return res.end(await toBuffer(qr));
        }

        if (connection === "close") {
          let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
          if (reason === DisconnectReason.connectionClosed) {
            console.log("Connection closed");
          } else if (reason === DisconnectReason.connectionLost) {
            console.log("Connection lost from server!");
          } else if (reason === DisconnectReason.restartRequired) {
            console.log("Restart required, restarting...");
            } else if (reason === DisconnectReason.timedOut) {
            console.log("Connection timed out");
          } else {
            console.log("Connection closed with bot. Please run again.");
            console.log(reason);
          }
        }
      });

      Smd.ev.on("creds.update", saveCreds);

    } catch (err) {
      if (!res.headersSent) {
        res.json({ code: "Service is Currently Unavailable" });
      }
      console.log(err);
    }
  }

  WASI().catch(async (err) => {
    console.log(err);
    await fs.emptyDir(path.resolve(__dirname, "./auth_info_baileys"));
  });
});

// New endpoint to fetch session status as JSON
app.get("/session", (req, res) => {
  res.json(sessionStatus);
});

app.listen(PORT, () =>
  console.log(`App listening on http://localhost:${PORT}`)
);

