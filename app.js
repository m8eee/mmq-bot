const express = require('express');
const app = express();
const fs = require('fs');
const { join } = require('path');
const bodyParser = require('body-parser');
const request = require('request');

const fetch = require('node-fetch');
var questionToSend = require('./question.js');

app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("Hi!");
});

var verify_token = "changeMathForever"

app.get('/math-bot', (req, res) => {
    var thisQuery = req.query;
    if (thisQuery['hub.verify_token'] === verify_token) {
        res.send(thisQuery['hub.challenge']);
    } else if (!thisQuery['hub.verify_token']) {
        res.send("You do not seem to have a token.");
    }
});

app.post('/math-bot', (req, res) => {
    const msg = req.body;
    var senderID = msg.entry[0].messaging[0].sender.id;
    var usersRaw = fs.readFileSync('math-bot-users.json');
    var usersData = JSON.parse(usersRaw);
    var body = {
        recipient:{
            id: senderID
        },
        message:{
            text: "Welcome to Mazzy Math Quiz! Type PLAY to start playing!"
        }
    };
    var thisUser = usersData.find(user => user.id === senderID);
    if (!thisUser) {
        usersData.push({ id: senderID, lvl: 1, levelAnswer: "a" });
        var processedTransaction = JSON.stringify(usersData, null, 4);
        fs.writeFileSync('math-bot-users.json', processedTransaction);
        body.message.text = "Welcome to Mazzy Math Quiz! Type PLAY to start playing!";
        fetch('https://graph.facebook.com/v8.0/me/messages?access_token=<ACCESS_TOKEN>', {
            method: 'post',
            body:    JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        });
    } else {
        if ((senderID !== "102739158231618") && (typeof msg.entry[0].messaging[0].message.text !== 'undefined') && (msg.entry[0].messaging[0].message.text !== null)) {
            var messageText = "";
            messageText += msg.entry[0].messaging[0].message.text;
            if (messageText.toLowerCase() == "play") {
                var nextQuestion = questionToSend(thisUser.lvl);
                var responseText = "Level " + thisUser.lvl + ":\n";
                responseText += "\n";
                responseText += nextQuestion.question;
                thisUser.levelAnswer = nextQuestion.correctAnswer;
                var processedTransaction = JSON.stringify(usersData, null, 4);
                fs.writeFileSync('math-bot-users.json', processedTransaction);
                body.message.text = responseText;
                fetch('https://graph.facebook.com/v8.0/me/messages?access_token=<ACCESS_TOKEN>', {
                    method: 'post',
                    body:    JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json' },
                });
            } else if ((messageText.toLowerCase() == "a") || (messageText.toLowerCase() == "b") || (messageText.toLowerCase() == "c") || (messageText.toLowerCase() == "d")) {
                if (thisUser.levelAnswer === messageText.toLowerCase()) {
                    thisUser.lvl += 1;
                    if (thisUser.lvl < 21) {
                        var nextQuestion = questionToSend(thisUser.lvl);
                        var responseText = "You got the question right! Onto Level " + thisUser.lvl + ":\n";
                        responseText += "\n";
                        responseText += nextQuestion.question;
                        thisUser.levelAnswer = nextQuestion.correctAnswer;
                        var processedTransaction = JSON.stringify(usersData, null, 4);
                        fs.writeFileSync('math-bot-users.json', processedTransaction);
                        body.message.text = responseText;
                        fetch('https://graph.facebook.com/v8.0/me/messages?access_token=<ACCESS_TOKEN>', {
                            method: 'post',
                            body:    JSON.stringify(body),
                            headers: { 'Content-Type': 'application/json' },
                        });
                    } else {
                        var nextQuestion = questionToSend(thisUser.lvl);
                        var responseText = "Congratulations! You have made it to the end of the game! Please share this with your friends.\n\nType RESTART to play the game all over again!";
                        thisUser.levelAnswer = nextQuestion.correctAnswer;
                        var processedTransaction = JSON.stringify(usersData, null, 4);
                        fs.writeFileSync('math-bot-users.json', processedTransaction);
                        body.message.text = responseText;
                        fetch('https://graph.facebook.com/v8.0/me/messages?access_token=<ACCESS_TOKEN>', {
                            method: 'post',
                            body:    JSON.stringify(body),
                            headers: { 'Content-Type': 'application/json' },
                        });
                    }
                } else {
                    var responseText = "You got the question wrong. ;-; Type PLAY to play again.\n";
                    var processedTransaction = JSON.stringify(usersData, null, 4);
                    fs.writeFileSync('math-bot-users.json', processedTransaction);
                    body.message.text = responseText;
                    fetch('https://graph.facebook.com/v8.0/me/messages?access_token=<ACCESS_TOKEN>', {
                        method: 'post',
                        body:    JSON.stringify(body),
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            } else if (messageText.toLowerCase() == "restart") {
                thisUser.lvl = 1;
                var nextQuestion = questionToSend(thisUser.lvl);
                var responseText = "Level " + thisUser.lvl + ":\n";
                responseText += "\n";
                responseText += nextQuestion.question;
                thisUser.levelAnswer = nextQuestion.correctAnswer;
                var processedTransaction = JSON.stringify(usersData, null, 4);
                fs.writeFileSync('math-bot-users.json', processedTransaction);
                body.message.text = responseText;
                fetch('https://graph.facebook.com/v8.0/me/messages?access_token=<ACCESS_TOKEN>', {
                    method: 'post',
                    body:    JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json' },
                });
            } else {
                body.message.text = `Command not recognized. If you are trying to answer, simply type the letter of your answer.\n\n✅ A\n❌ "A"\n❌ 'A'\n❌ AAAAA`;
                fetch('https://graph.facebook.com/v8.0/me/messages?access_token=<ACCESS_TOKEN>', {
                    method: 'post',
                    body:    JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }
    }

    res.status(200).send(req.body);
});

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Listening on port ${port}...`));