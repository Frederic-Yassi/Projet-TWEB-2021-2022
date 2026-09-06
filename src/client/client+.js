const { Format } = require('../Modules/FormatMessage');
const { Sender } = require('../Modules/SendMessage');
const { Command } = require('../Modules/Commande');
const { decrypter } = require('../Modules/Func_Crypt');
var inquirer = require('inquirer');
const { env } = require('process');
const { createECDH, } = require('crypto');
const debug = require("debug");
var chalk = require('chalk');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

//Ce fichier contient des instructions permettant la creation d'un client

var questions = [
    {
        type: 'input',
        name: 'commande',
        message: ">",
    }
];

env.DEBUG = "client";
env.PORT = "8080";          //port 
env.HOST = "127.0.0.1";     //adresse


const logClient = debug("client");
console.log('Client actif');

var sender_name = "";
var password = "";
var sender;
var format;
var invite_group;
var args = process.argv;

// Passage d'arguments par ligne de commande
for (let arg of args) {
    if (arg.includes("PORT=")) {
        port = arg.split('=')[1];
        process.env.PORT = port;
    }
    if (arg.includes("HOST=")) {
        host = arg.split('=')[1];
        process.env.HOST = host;
    }
}
// Variables d'environnement
var envn = Object.entries(process.env)
for (let elementEnv of envn) {
    if (elementEnv[0] == "HOST") {
        host = elementEnv[1];
    }
    if (elementEnv[0] == "PORT") {
        port = elementEnv[1];
    }
}

const ioClient = require('socket.io-client').connect("http://localhost:8080");

const client = createECDH('secp521r1');
const clientKey = client.generateKeys();  //Generation des clés pour algo de Duffie Hellman

ioClient.on("connect", function (socket) { //Code a executer apres connection au server
    format = new Format("client", "pubKey");
    sender = new Sender(format, ioClient);
    sender.complete(sender_name, clientKey.toString('hex'));
    sender.send();
    console.log("Securisation de la connexion en cours ...");
});

ioClient.on("secure", function (data) { //Code a executer pour securiser les echanges
    msg = JSON.parse(data);
    let Key = Buffer.from(msg.value, 'hex');
    Secret = client.computeSecret(Key).slice(0, 32);
    iv = msg.iv;
    console.log("BIENVENUE SUR NOTRE APP");
    console.log("Connexion securisée.");
    console.log("Appuie sur ENTREE pour continuer.")
    questions = [
        {
            type: 'input',
            name: 'nom',
            message: 'Quel est ton nom ?',
            validate(value) {
                const valid = (value != "");
                return valid || 'Please enter a name not empty';
            },
            filter: String,
        },
        {
            type: 'input',
            name: 'password',
            message: 'Quel est ton password ?',
            validate(value) {
                const valid = ((value != "") && (value.length > 7));
                return valid || 'Please password de 8 chiffres au moins';
            },
            filter: String,
        },
    ];
});

ioClient.on("authentification", function (enc) { //Code apres envoi du nom + mot de passe
    var data = decrypter(Secret, iv, enc);
    data = JSON.parse(data);
    if (data.accord == false) {
        console.log("Authentification refusée");
        process.exit();
    }
    else {
        console.log("Authentification validée");
        process.on('SIGINT', function () {
            console.log("\n Bye bye");
            let d = Command.getCommandPar("q;");
            let commande = new Command(d[0]);
            commande.execute(ioClient, sender_name, d, Secret, iv);
            process.exit();
        });
    }
});


ioClient.on('data', function (enc) { //code à executer en cas d'evenement data
    var data = decrypter(Secret, iv, enc);
    data = JSON.parse(data);
    switch (data.action) {
        case "client-quit": //deconnexion
            console.log(data.msg);
            break;
        case "client-list-clients"://liste des utilisateurs
            console.log(data.msg);
            break;
        case "deldata": //suppression de données
            console.log(data.msg);
            break;
        case "getdata": //recuperation des données
            console.log(data.msg);
            break; 
           
    }
});

ioClient.on('PrivateMessage', function (enc) { //code à executer en cas de reception de message privé
    var data = decrypter(Secret, iv, enc)
    data = JSON.parse(data);
    console.log(chalk.yellow(data.msg));
});

ioClient.on('BroadcastMessage', function (enc) { //code à executer en cas de reception de broadcast message
    var data = decrypter(Secret, iv, enc)
    data = JSON.parse(data);
    console.log(chalk.cyan(data.msg));
});

ioClient.on('GroupMessage', function (enc) {//code à executer en cas de reception de message de groupe
    var data = decrypter(Secret, iv, enc)
    data = JSON.parse(data);
    invite_group = data.group;
    if (data.action == "invite") { //on traite le cas special de confirmation d'ajout dans un groupe
        questions = [
            {
                type: 'confirm',
                name: 'invitation',
                message: " - Veux-tu rejoindre le groupe -" + data.group + "- ? (ENTREE accepte par défaut)",
                default: true
            }
        ];
    }
    console.log(chalk.magenta(data.msg)); 
});

ioClient.on('erreur', function (enc) { //code à executer en cas de reception de message privé
    var data = decrypter(Secret, iv, enc);
    data = JSON.parse(data);
    console.log(chalk.red('Attention : ' + data.msg));
});

ioClient.on('disconnect', function (data) { //code à executer en cas de deconnexion du server
    console.log('Fermeture du serveur...');
    process.exit();
});
process.stdin.setEncoding('utf8');

process.on('SIGINT', function () { //code à executer en cas d'appui sur "ctrl+c"
    console.log("\n Bye bye");
    let d = Command.getCommandPar("q;");
    let commande = new Command(d[0]);
    commande.execute(ioClient, sender_name, d, Secret, iv);
    process.exit();
});

var passed = 0;
function ask() { //fonction principale 
    inquirer.prompt(questions).then((answers) => {
        if (questions[0].name == 'password' || questions[0].name == 'nom') {
            if (passed > 0) {
                format = new Format("client", "connection");
                sender = new Sender(format, ioClient);
                sender_name=answers.nom;
                sender.complete(answers.nom, answers.password);
                sender.send(null, Secret, iv);
                questions = [
                    {
                        type: 'input',
                        name: 'commande',
                        message: ">",
                    }
                ];
                passed = 0;
            } else {
                passed += 1;
            }
        } else if (questions[0].name == 'invitation') {
            if (passed > 0) {
                if (answers.invitation) {
                    format = new Format("client", "join");
                    sender = new Sender(format, ioClient);
                    sender.complete(sender_name, invite_group, "yes");
                    sender.send(null, Secret, iv);
                    questions = [
                        {
                            type: 'input',
                            name: 'commande',
                            message: ">",
                        }
                    ];
                    passed = 0;
                } else {
                    questions = [
                        {
                            type: 'input',
                            name: 'commande',
                            message: ">",
                        }
                    ];
                    passed = 0;
                }
            } else {
                passed += 1;
            }
        } else {
            let c = Command.getCommandPar(answers.commande);
            switch (c) {
                case '':
                    break;
                case 'error':
                    console.log("Commande invalide");
                    break;
                case 'groupName-error':
                    console.log("Le nom de groupe n'est pas valide.");
                    break;
                default:
                    commande = new Command(c[0]);
                    commande.execute(ioClient, sender_name, c, Secret, iv);
                    break;
            }
        }
        ask();
    })
}

ask();

