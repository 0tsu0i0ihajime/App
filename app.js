const express = require("express"),
    session = require("express-session"),
    bodyParser = require("body-parser"),
    path = require("path"),
    cookieParser = require("cookie-parser"),
    fs = require("fs"),
    { spawn } = require("child_process"),
    crypto = require("crypto");

//let download = spawn("pip3", ["install", "yt-dlp"]);
let users = JSON.parse(fs.readFileSync("pass.json", "utf8"));
let tar_URL = "/";
const app = express();

fs.watch("pass.json", (event, filename) => {
    if (event === "change") {
        console.log(`${filename}change!`);
        users = JSON.parse(fs.readFileSync("pass.json", "utf8"));
    }
});

app.use(
    session({
        secret: "My Secret Key: Common",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "form.html"));
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username && !password) {
        res.send(
            `<body>Please enter a username and password<br><a href="${tar_URL}">Visit Login Form</a></body>`
        );
        return;
    }

    if (username && password) {
        if (users[username] === password) {
            req.session.username = username;
            const uniqueKey = `${username}:${password}`;
            const sessionID = crypto
                .createHash("sha256")
                .update(uniqueKey)
                .digest("hex");
            res.cookie("sessionId", sessionID);
            res.sendFile(path.join(__dirname, "public", "stream.html"));
        } else {
            res.redirect("/");
            return;
        }
    }
});

app.post("/stream", (req, res) => {
    const { sessionId } = req.cookies;
    if (!sessionId || !req.session.username) {
        res.redirect("/");
        return;
    }
    if (!req.body.url) {
        res.sendFile(path.join(__dirname, "public", "stream.html"));
        return;
    }
    const { url } = req.body;
    if (url.indexOf("　") !== -1) {
        res.send(
            '<body>全角スペース入力するな<br><a href="' +
            tar_URL +
            '">Visit Login Form</a></body>'
        );
        return;
    }
    req.session.url = url;
    // res.send(req.session)
    res.redirect("/play");
});

app.get("/send", (req, res) => {
    if (!req.session.filePath) {
        res.redirect("/stream");
        return;
    } else {
        const targetString = "[ExtractAudio] Destination: ";
        const filepath = req.session.filePath;
        const { sessionId } = req.cookies;
        const tarNumber = req.session.Number;
        tarNumber += 1;
        const jsonPath = path.join(__dirname, 'public', sessionId, 'data.json');
        const jsonData = JSON.parse(jsonPath);
        jsonData.fileName = filepath;
        const nextUrl = json.url.replace(/'/g, '"')[tarNumber];
        const audioPath = filepath.replace(/^public\/[^/]+\//, './');
        const Tar = path.join(__dirname, 'public', sessionId, 'send.html');
        let outputData = []
        const args = [
            "-o",
            `public/${sessionId}/.data/%(title)s.%(ext)s`,
            "--extract-audio",
            "--audio-format",
            "mp3",
            nextUrl
        ]
        const content = `<!DOCTYPE html>
        <html lang="ja">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                html, body {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                }
        
                .wrapper {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                }
        
                .content { 
                    width: 80vw;
                    height: 80vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
        
                audio {
                    width: 70%;
                    min-width: 300px;
                }
            </style>
            <title>audio</title>
        </head>
        
        <body>
            <div class="wrapper">
                <div class="content">
                    <audio id="audioPlayer" controls>
                        <source src="${audioPath}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            </div>
            <script>
                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.onended = () => {
                    console.log('end')
                    fetch('/song-end', {method: "POST"})
                }
            </script>
        </body>
        
        </html>`
        try {
            fs.writeFileSync(Tar, content);
            console.log(`${Tar}を保存しました`);
            if (nextUrl) {
                const nextDl = spawn("yt-dlp", args);
                req.session.Number = tarNumber;
                res.sendFile(Tar);
                nextDl.stdout.on("data", (data) => {
                    console.log(`stdout: ${data}`);
                    outputData += data.toString();
                });
                nextDl.stderr.on("data", (data) => {
                    console.log(`stderr: ${data}`);
                });
                nextDl.on("close", (code) => {
                    console.log(`yt-dlp process exited with code ${code}`);
                    try {
                        fs.unlinkSync(filepath)
                        console.log(`${filepath}を削除しました。`)
                        let next = outputData.trim().split("\n").slice(-2, -1)[0].substring(targetString.length);
                        jsonData.fileName = next;
                    } catch {
                        console.error(err)
                    }
                });
            }else{
                res.send('end');
                return
            }
        } catch (err) {
            console.log(err)
            res.send(err)
            return
        }
    }
});

app.post("/song-end", (req, res) => {
    const { sessionId } = req.cookies;
    const Tar = path.join(__dirname, 'public', sessionId, 'send.html')
    const content = `<!DOCTYPE html>
        <html lang="ja">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                html, body {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                }
        
                .wrapper {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                }
        
                .content { 
                    width: 80vw;
                    height: 80vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
        
                audio {
                    width: 70%;
                    min-width: 300px;
                }
            </style>
            <title>audio</title>
        </head>
        
        <body>
            <div class="wrapper">
                <div class="content">
                    <audio id="audioPlayer" controls>
                        <source src="${audioPath}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            </div>
            <script>
                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.onended = () => {
                    console.log('end')
                    fetch('/song-end', {method: "POST"})
                }
            </script>
        </body>
        
        </html>`
    try {
        fs.writeFileSync(Tar, content);
        console.log(`${Tar}を保存しました`);
        res.sendFile(Tar);
    } catch (err) {
        console.log(err)
        res.send(err)
        return
    }
})

app.get("/play", (req, res) => {
    const targetString = "[ExtractAudio] Destination: ";
    const url = req.session.url;
    const { sessionId } = req.cookies;
    req.session.output = [];
    const checkInfo = spawn("python3", ["info.py", url]);
    checkInfo.stdout.on("data", (data) => {
        console.log(data.toString());
        req.session.output += data.toString();
    });
    checkInfo.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
        res.send(`Error: ${data}`);
        return;
    });
    checkInfo.on("exit", () => {
        req.session.lastLine = req.session.output.trim().split("\n").pop();
        if (!fs.existsSync(`public/${sessionId}`)) {
            fs.mkdirSync(`public/${sessionId}`);
            fs.mkdirSync(`public/${sessionId}/.data`)
        }
        fs.writeFileSync(
            `public/${sessionId}/data.json`,
            JSON.stringify({ url: req.session.lastLine })
        );
        req.session.Number = 0;
        delete req.session.url;
        delete req.session.output;
        const args = [
            "-o",
            `public/${sessionId}/.data/%(title)s.%(ext)s`,
            "--extract-audio",
            "--audio-format",
            "mp3",
            JSON.parse(req.session.lastLine.replace(/'/g, '"'))[req.session.Number],
        ];
        const DLMusic = spawn("yt-dlp", args);
        DLMusic.stdout.on("data", (data) => {
            req.session.output += data.toString();
            console.log(`stdout: ${data}`);
        });
        DLMusic.stderr.on("data", (data) => {
            console.error(`stderr: ${data}`);
            res.send(`Error: ${data}`);
            return;
        });
        DLMusic.on("close", (code) => {
            console.log(`yt-dlp process exited with code ${code}`);
            // req.session.lastStr = req.session.output.trim().split("\n").slice(-2,-1)[0]
            req.session.filePath = req.session.output.trim().split("\n").slice(-2, -1)[0].substring(targetString.length);
            console.log(`抽出データー: ${req.session.filePath}`);
            res.redirect("/send");
            return;
        });
    });
});

app.listen(process.env.PORT || 8080, () => {
    console.log(`Server listening on port ${process.env.PORT || 8080}`);
});
