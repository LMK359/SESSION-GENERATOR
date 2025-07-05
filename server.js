const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 3000;

// Root route
app.get("/", (req, res) => {
  res.send("✅ LMK SESSION GENERATOR API IS ONLINE");
});

// ===== /code route =====
app.get("/code", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.send({ code: "❌ No number provided" });

  const sessionPath = `./sessions/${number}.json`;
  fs.mkdirSync("./sessions", { recursive: true });
  const { state, saveState } = useSingleFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['LMK-BOT', 'Chrome', '110.0.0.0'],
    logger: pino({ level: 'silent' }),
  });

  let sent = false;

  sock.ev.on("connection.update", async (update) => {
    const { qr, pairingCode, connection } = update;

    if (!sent && (qr || pairingCode)) {
      sent = true;
      res.send({
        code: qr || pairingCode,
        type: qr ? "qr" : "pair"
      });
    }

    if (connection === "open") {
      console.log("✅ Connected");
      sock.end();
    }
  });

  sock.ev.on("creds.update", saveState);

// ===== Pair route =====
const pairRouter = require("./pair");
app.use("/pair", pairRouter);

// ===== QR route =====
const qrRouter = require("./wasiqr");
app.use("/qr", qrRouter);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
