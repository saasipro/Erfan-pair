const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');

const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    
    async function Erfan_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        let sock;
        let connectionClosed = false;
        
        try {
            sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
                browser: ["Ubuntu", "Chrome", "20.0.04"],
                shouldSyncHistoryMessage: () => false,
                shouldIgnoreJid: () => false,
                getMessage: async () => undefined
            });
            
            sock.ev.on('creds.update', saveCreds);
            
            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);
                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                
                if (connection === "open") {
                    console.log(`Connection opened for ${sock.user.id}`);
                    
                    // Wait longer to ensure proper linking (30 seconds instead of 5)
                    await delay(30000);
                    
                    try {
                        let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                        let rf = __dirname + `/temp/${id}/creds.json`;
                        
                        function generateRandomText() {
                            const prefix = "3EB";
                            const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                            let randomText = prefix;
                            for (let i = prefix.length; i < 22; i++) {
                                const randomIndex = Math.floor(Math.random() * characters.length);
                                randomText += characters.charAt(randomIndex);
                            }
                            return randomText;
                        }
                        
                        const randomText = generateRandomText();
                        const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        let md = "IK~" + string_session;
                        
                        // 1. First send session ID
                        let codeMsg = await sock.sendMessage(sock.user.id, { text: md });
                        
                        // 2. Then send welcome message
                        await sock.sendMessage(
                            sock.user.id,
                            {
                                text: '*Hello there 𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟 User! \ud83d\udc4b\ud83c\udffb* \n\n> Do not share your session id with anyone. use it only for bot deploy.\n\n *Thanks for using 𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟 Bots \ud83c\uddf5\ud83c\uddf0* \n\n> Join WhatsApp Channel :- ⤵️\n \nhttps://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J\n\n _Dont forget to give star to repos ⬇️_ \n\n- *𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟 Repository ✅* \n\nhttps://github.com/ERFAN-Md/DARKZONE-MD\n\n- *DARKZONE-MD Repository ✅*\n\nhttps://github.com/ERFAN-Md/DARKZONE-MD\n\n> *Powered BY 𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟* \ud83d\udda4'
                            },
                            { quoted: codeMsg }
                        );
                        
                    } catch (e) {
                        console.error('Error during session processing:', e);
                        let errorMsg = await sock.sendMessage(sock.user.id, { text: e.toString() });
                        let desc = `*Don't Share with anyone this code use for deploying 𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟 MD*\n\n ◦ *Github:* https://github.com/DARKZONE-MD/DARKZONE-MD`;
                        await sock.sendMessage(sock.user.id, { text: desc }, { quoted: errorMsg });
                    }
                    
                    // Ensure everything is saved before closing
                    await delay(5000);
                    if (!connectionClosed) {
                        connectionClosed = true;
                        await sock.ws.close();
                        await removeFile('./temp/' + id);
                        console.log(`👤 ${sock.user.id} 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 ✅ 𝗖𝗹𝗼𝘀𝗶𝗻𝗴 𝗰𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗼𝗻...`);
                    }
                } 
                else if (connection === "close") {
                    if (lastDisconnect?.error?.output?.statusCode !== 401) {
                        console.log('Connection closed unexpectedly, attempting reconnect...');
                        await delay(10000); // Wait 10 seconds before reconnecting
                        if (!connectionClosed) {
                            await Erfan_MD_PAIR_CODE();
                        }
                    }
                }
            });
            
            // Handle process exit gracefully
            process.on('exit', async () => {
                if (!connectionClosed && sock) {
                    connectionClosed = true;
                    await sock.ws.close();
                    await removeFile('./temp/' + id);
                }
            });
            
        } catch (err) {
            console.error("Error in pairing process:", err);
            if (sock && !connectionClosed) {
                try {
                    await sock.ws.close();
                } catch (e) {}
            }
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                res.send({ code: "❗ Service Unavailable" });
            }
        }
    }
    
    await Erfan_MD_PAIR_CODE();
});

module.exports = router;
