
const { Format } = require('../Modules/FormatMessage');
const { Sender } = require('../Modules/SendMessage');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const fonction = require("../Modules/Func_DataBase");
const { decrypter } = require('../Modules/Func_Crypt');

//Dans ce fichier on cree notre server

const http = require("http");
const { env } = require('process');
env.DEBUG = "server";
env.PORT = 8080;            //port  
env.HOST = "127.0.0.1";     //adresse
console.log(env.DEBUG);

const {
    createECDH,
} = require('crypto');
var args = process.argv;
const debug = require("debug");
const logServer = debug("server");
console.log('Serveur en marche ...');

let port = env.PORT;
let host = env.HOST;

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

// Socket.IO 2 attend (httpServer) ou (port, optionsObject), pas (port, host)
const httpServer = http.createServer();
const server = require("socket.io")(httpServer);
httpServer.listen(Number(port), host);

var sender;
var format;
const serv = createECDH('secp521r1');
const SecretMap = new Map();


var servKey;
var Key;

server.on("connection", (socket) => { //connection du server

    servKey = serv.generateKeys();
    iv = 'a2xhcgAAAAAAAAAB';
    let aujourdhui = new Date();
    console.log(aujourdhui + ": new client");

    socket.once('secure', function (data) { //echange de clé avec le client 
        msg = JSON.parse(data);
        Key = Buffer.from(msg.value, 'hex');
        Secret = serv.computeSecret(Key).slice(0, 32);
        format = new Format("server", "pubKey");
        sender = new Sender(format, socket);
        sender.complete(msg.from, servKey.toString('hex'), iv);
        sender.send();
        SecretMap.set(socket.id, Secret);
        console.log("Connexion securisé ...");
    });

    socket.on('data', function (enc) { //gestion de l'evenement data 
        var Secret = SecretMap.get(socket.id);
        var data = decrypter(Secret, iv, enc);
        msg = JSON.parse(data);
        console.log('DATA received from ' + socket.id + ':' + data);
        switch (msg.action) {
            case 'client-hello-auto':  //authentification du client
                fonction.GetUser(msg.from, function (data) {
                    if (data.length == 0) {
                        fonction.SaveUser(socket.id, msg.from, msg.pwd);
                        format = new Format("server", "connection");
                        sender = new Sender(format, socket);
                        sender.complete(msg.from, true);
                        sender.send(null, Secret, iv);
                    }
                    else {
                        fonction.Authentification(msg.from, msg.pwd, function (result) {
                            if (result) {
                                fonction.ChangeId(data[0].Socket_Id, socket.id);
                                format = new Format("server", "connection");
                                sender = new Sender(format, socket);
                                sender.complete(msg.from, true);
                                sender.send(null, Secret, iv);
                                format = new Format("server", "broadcast");
                                sender = new Sender(format, server);
                                sender.complete(socket.id, "server", msg.from + " is connected");
                                SecretMap.forEach(function (value, key) {
                                    if (key != socket.id) {
                                        sender.send(key, value, iv);
                                    }
                                })
                            }
                            else {
                                format = new Format("server", "connection");
                                sender = new Sender(format, socket);
                                sender.complete(msg.from, false);
                                sender.send(null, Secret, iv);
                                console.log("quelqu'un essaie de se connecter au compte de " + msg.from);

                            }

                        });

                    }
                });


                break;
            case "client-list-clients": //demande de liste de clients
                let liste = [];
                format = new Format("server", "list");
                sender = new Sender(format, socket);
                fonction.GetAllUser(function (data) {
                    data.forEach(element => {
                        liste.push(element.Name);
                    });

                    sender.complete(socket.id, msg.from, liste.join(" , "));
                    sender.send(null, Secret, iv);

                });
                break;

            case "client-quit": //demande de deconnection
                format = new Format("server", "quit");
                sender = new Sender(format, socket);
                sender.complete(socket.id, msg.from);
                sender.send(null, Secret, iv);

                format = new Format("server", "broadcast");
                sender = new Sender(format, server);
                sender.complete(socket.id, "server", msg.from + " is disconnected");
                SecretMap.forEach(function (value, key) {
                    if (key != socket.id) {
                        sender.send(key, value, iv);
                    }
                })

                socket.disconnect();
                console.log(msg.from + " is disconnected");

                break;
            default:
                console.log(msg);
        }
    });

    socket.on('PrivateMessage', function (enc) { //envoi de message privé
        var Secret = SecretMap.get(socket.id);
        var data = decrypter(Secret, iv, enc);
        msg = JSON.parse(data);
        console.log('DATA received from ' + socket.id + ':' + data);
        fonction.GetUser(msg.to, function (data) {
            if (data.length == 0) {
                format = new Format("server", "error");
                sender = new Sender(format, socket);
                sender.complete("Le destinataire n'existe pas.");
                sender.send(socket.id, Secret, iv);
            }
            else {
                format = new Format("server", "send");
                sender = new Sender(format, server);
                sender.complete(socket.id, msg.from, msg.msg);
                if (SecretMap.get(data[0].Socket_Id) != undefined) {
                    sender.send(data[0].Socket_Id, SecretMap.get(data[0].Socket_Id), iv);
                    fonction.SaveMessageUser("send", msg.from, msg.to, sender.returnMessage());
                }
            }
        })
    });

    socket.on('BroadcastMessage', function (enc) { //envoi de message en broadcast
        var Secret = SecretMap.get(socket.id);
        var data = decrypter(Secret, iv, enc);
        msg = JSON.parse(data);
        console.log('DATA received from ' + socket.id + ':' + data);
        format = new Format("server", "broadcast");
        sender = new Sender(format, server);
        sender.complete(socket.id, msg.from, msg.msg);
        SecretMap.forEach(function (value, key) {
            if (key != socket.id) {
                sender.send(key, value, iv);
            }
        });
        fonction.SaveMessageUser("broadcast", msg.from, "all", sender.returnMessage().msg);
    });

    socket.on('GroupMessage', function (enc) { //envoi et demande de type GroupMessage
        var Secret = SecretMap.get(socket.id);
        var data = decrypter(Secret, iv, enc);
        msg = JSON.parse(data);
        console.log('DATA received from ' + socket.id + ':' + data);
        switch (msg.action) {
            case "cgroupe":     //demande de creation de groupe
                if (msg.group == "") {
                    format = new Format("server", "error");
                    sender = new Sender(format, socket);
                    sender.complete("Le nom du groupe est invalide.");
                    sender.send(socket.id, Secret, iv);
                }
                else {
                    fonction.GetAllGroup(function (data) {
                        if (data.length == 0) {
                            format = new Format("server", "creategroupe");
                            sender = new Sender(format, socket);
                            sender.complete(socket.id, msg.from, msg.group);
                            sender.send(null, Secret, iv);
                            fonction.SaveGroup(msg.from, msg.group, msg.public);
                        }
                        else {
                            fonction.GetMembres(msg.group, function (data) {
                                if (data.length != 0) {
                                    format = new Format("server", "error");
                                    sender = new Sender(format, socket);
                                    sender.complete("Le groupe -" + msg.group + "- existe deja.");
                                    sender.send(socket.id, Secret, iv);
                                }
                                else {
                                    fonction.SaveGroup(msg.from, msg.group, msg.public);
                                    format = new Format("server", "creategroupe");
                                    sender = new Sender(format, socket);
                                    sender.complete(socket.id, msg.from, msg.group);
                                    sender.send(null, Secret, iv);
                                    fonction.SaveAction(msg.group, "cgroupe", msg.from, "", "");
                                }
                            });
                        }
                    });
                }
                break;
            case "join":    //demande de rejoindre un groupe
                fonction.GetMembres(msg.group, function (data) {
                    if (data.length == 0) {
                        logServer("aucun membres")
                        format = new Format("server", "error");
                        sender = new Sender(format, socket);
                        sender.complete("Le groupe -" + msg.group + "- n'existe pas.");
                        sender.send(null, Secret, iv);
                    }
                    else {
                        fonction.IsBanned(msg.from, msg.group, function (data) {
                            if (data.length != 0) {
                                format = new Format("server", "error");
                                sender = new Sender(format, socket);
                                sender.complete("Tu es sur la liste noire du groupe -" + msg.group + "-.");
                                sender.send(null, Secret, iv);
                            }
                            else {
                                fonction.GetPublic(msg.group, function (data) {
                                    if (data[0].Public != "yes") {
                                        if (msg.invited == 'yes') {
                                            fonction.SaveGroup(msg.from, msg.group, "yes");
                                            format = new Format("server", "join");
                                            sender = new Sender(format, socket);
                                            sender.complete(socket.id, msg.from, msg.group);
                                            sender.send(null, Secret, iv);

                                            fonction.GetMembres(msg.group, function (data) {
                                                data.forEach(element => {
                                                    format = new Format("server", "broadcastgroup");
                                                    sender = new Sender(format, server);
                                                    sender.complete(socket.id, msg.from, msg.group, element.Name + " a rejoint le groupe -" + msg.group + "-.");
                                                    if (SecretMap.get(element.Socket_Id) != undefined) {
                                                        sender.send(element.Socket_Id, SecretMap.get(element.Socket_Id), iv);
                                                    }
                                                    fonction.SaveAction(msg.group, "join", msg.from, "", "");
                                                });
                                            })

                                        } else {
                                            format = new Format("server", "error");
                                            sender = new Sender(format, socket);
                                            sender.complete("Tu ne peux pas rentrer dans ce groupe.");
                                            sender.send(null, Secret, iv);
                                        }
                                    }
                                    else {
                                        fonction.IsMember(msg.from, msg.group, function (data) {
                                            if (data.length != 0) {
                                                format = new Format("server", "error");
                                                sender = new Sender(format, socket);
                                                sender.complete("Tu es deja membre du groupe.");
                                                sender.send(null, Secret, iv);
                                            }
                                            else {
                                                fonction.SaveGroup(msg.from, msg.group, "yes");
                                                format = new Format("server", "join");
                                                sender = new Sender(format, socket);
                                                sender.complete(socket.id, msg.from, msg.group);
                                                sender.send(null, Secret, iv);

                                                fonction.GetMembres(msg.group, function (data) {
                                                    data.forEach(element => {
                                                        format = new Format("server", "broadcastgroup");
                                                        sender = new Sender(format, server);
                                                        sender.complete(socket.id, msg.from, msg.group, element.Name + " a rejoint le groupe -" + msg.group + "-.");
                                                        if (SecretMap.get(element.Socket_Id) != undefined) {
                                                            sender.send(element.Socket_Id, SecretMap.get(element.Socket_Id), iv);
                                                        }
                                                        fonction.SaveAction(msg.group, "join", msg.from, "", "");
                                                    });
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                });
                break;
            case "gbroadcast":  //envoi de message dans un groupe
                fonction.GetMembres(msg.group, function (data) {
                    if (data.length == 0) {
                        format = new Format("server", "error");
                        sender = new Sender(format, socket);
                        sender.complete("Le groupe n'existe pas.");
                        sender.send(null, Secret, iv);
                    }
                    else {
                        fonction.IsMember(msg.from, msg.group, function (data) {
                            if (data.length == 0) {
                                format = new Format("server", "error");
                                sender = new Sender(format, socket);
                                sender.complete("Tu n'es pas membre du groupe -" + msg.group + "-.");
                                sender.send(null, Secret, iv);
                            }
                            else {
                                fonction.GetMembres(msg.group, function (data) {
                                    data.forEach(element => {
                                        format = new Format("server", "broadcastgroup");
                                        sender = new Sender(format, server);
                                        sender.complete(socket.id, msg.from, msg.group, msg.msg);
                                        if ((SecretMap.get(element.Socket_Id) != undefined) && (element.Socket_Id != socket.id)) {

                                            sender.send(element.Socket_Id, SecretMap.get(element.Socket_Id), iv);
                                        }
                                        fonction.SaveMessage(msg.group, msg.from, sender.returnMessage().msg);
                                    });
                                    fonction.SaveAction(msg.group, "gbroadcast", msg.from, "All", "");
                                })
                            }
                        })
                    }
                });
                break;
            case "members": //demande de liste des membres d'un groupe
                fonction.GetMembres(msg.group, function (data) {
                    if (data.length == 0) {
                        format = new Format("server", "error");
                        sender = new Sender(format, socket);
                        sender.complete("Le groupe -" + msg.group + "- n'existe pas.");
                        sender.send(null, Secret, iv);
                    }
                    else {
                        fonction.IsMember(msg.from, msg.group, function (data) {
                            if (data.length == 0) {
                                format = new Format("server", "error");
                                sender = new Sender(format, socket);
                                sender.complete("Tu n'es pas membre du groupe -" + msg.group + "-.");
                                sender.send(null, Secret, iv);
                            }
                            else {
                                fonction.GetMembres(msg.group, function (data) {
                                    let l = [];
                                    data.forEach(element => {
                                        l.push(element.Name);
                                    });
                                    format = new Format("server", "listmembers");
                                    sender = new Sender(format, socket);
                                    sender.complete(socket.id, msg.from, msg.group, l.join(" , "));
                                    sender.send(null, Secret, iv);
                                })
                            }
                        })
                    }
                });
                break;
            case "msgs": //demande de messages d'un groupe
                fonction.GetMembres(msg.group, function (data) {
                    if (data.length == 0) {
                        format = new Format("server", "error");
                        sender = new Sender(format, socket);
                        sender.complete("Le groupe n'existe pas.");
                        sender.send(socket.id, Secret, iv);
                    }
                    else {
                        fonction.IsMember(msg.from, msg.group, function (data) {
                            if (data.length == 0) {
                                format = new Format("server", "error");
                                sender = new Sender(format, socket);
                                sender.complete("Tu n'es pas membre du groupe -" + msg.group + "-.");
                                sender.send(null, Secret, iv);
                            }
                            else {
                                fonction.GetMessages(msg.group, function (data) {
                                    let l = [];
                                    data.forEach((element) => {
                                        let message = JSON.stringify({ "from": element.Name, "group": element.GroupName, "message": element.Content, });
                                        l.push(message);
                                    });
                                    format = new Format("server", "listmessages");
                                    sender = new Sender(format, socket);
                                    sender.complete(socket.id, msg.from, msg.group, l.join(" , "));
                                    sender.send(null, Secret, iv);
                                })
                            }
                        })
                    }
                }
                );
                break;
            case "groups": //demande de liste des groupes
                fonction.GetAllGroup(function (data) {
                    let l = [];
                    data.forEach(element => {
                        l.push(element.GroupName);
                    })
                    format = new Format("server", "grouplist");
                    sender = new Sender(format, socket);
                    sender.complete(socket.id, msg.from, l.join(' , '));
                    sender.send(null, Secret, iv);
                });
                break;
            case "leave": //demande de quitter un groupe
                fonction.GetMembres(msg.group, function (data) {
                    if (data.length == 0) {
                        format = new Format("server", "error");
                        sender = new Sender(format, socket);
                        sender.complete("Le groupe n'existe pas.");
                        sender.send(null, Secret, iv);
                    }
                    else {
                        fonction.IsMember(msg.from, msg.group, function (data) {
                            if (data.length == 0) {
                                format = new Format("server", "error");
                                sender = new Sender(format, socket);
                                sender.complete("Tu n'es pas membre du groupe -" + msg.group + "-.");
                                sender.send(null, Secret, iv);
                            }
                            else {
                                format = new Format("server", "leave");
                                sender = new Sender(format, socket);
                                sender.complete(socket.id, msg.from, msg.group);
                                sender.send(null, Secret, iv);
                                fonction.RemoveMember(msg.from, msg.group);

                                fonction.GetMembres(msg.group, function (data) {
                                    data.forEach(element => {
                                        format = new Format("server", "broadcastgroup");
                                        sender = new Sender(format, server);
                                        sender.complete(socket.id, msg.from, msg.group, msg.from + " a quitté le groupe.");
                                        if (SecretMap.get(element.Socket_Id) != undefined) {
                                            sender.send(element.Socket_Id, SecretMap.get(element.Socket_Id), iv);
                                        }
                                        fonction.SaveMessage(msg.group, msg.from, sender.returnMessage().msg);
                                    });
                                });
                                fonction.SaveAction(msg.group, "gbroadcast", msg.from, "All", "");
                            }
                        })
                    }
                });
                break;
            case "invite": //demande d'inviter un utilisateur dans un groupe 
                fonction.GetMembres(msg.group, function (data) {
                    if (data.length == 0) {
                        format = new Format("server", "error");
                        sender = new Sender(format, socket);
                        sender.complete("Le groupe n'existe pas.");
                        sender.send(null, Secret, iv);
                    }
                    else {
                        fonction.IsBanned(msg.dest, msg.group, function (data) {
                            if (data.length != 0) {
                                format = new Format("server", "error");
                                sender = new Sender(format, socket);
                                sender.complete(msg.dest + " est sur la liste noire.");
                                sender.send(null, Secret, iv);
                            }
                            else {
                                fonction.IsMember(msg.from, msg.group, function (data) {
                                    if (data.length == 0) {
                                        format = new Format("server", "error");
                                        sender = new Sender(format, socket);
                                        sender.complete("Tu n'es pas membre du groupe -" + msg.group + "-.");
                                        sender.send(null, Secret, iv);
                                    }
                                    else {
                                        fonction.IsMember(msg.dest, msg.group, function (data) {
                                            console.log(data);
                                            if (data.length != 0) {
                                                format = new Format("server", "error");
                                                sender = new Sender(format, socket);
                                                sender.complete(msg.dest + " est deja membre du groupe.");
                                                sender.send(null, Secret, iv);
                                            }
                                            else {
                                                console.log(msg.from + " est désormais dans le groupe " + msg.group);
                                                format = new Format("server", "invite");
                                                sender = new Sender(format, server);
                                                sender.complete(socket.id, msg.from, msg.group, msg.dest);
                                                fonction.GetUser(msg.dest, function (data) {
                                                    if (data.length == 0) {
                                                        format = new Format("server", "error");
                                                        sender = new Sender(format, socket);
                                                        sender.complete("Le destinataire n'existe pas.");
                                                        sender.send(socket.id, Secret, iv);
                                                    } else {
                                                        if (SecretMap.get(data[0].Socket_Id) != undefined) {
                                                            sender.send(data[0].Socket_Id, SecretMap.get(data[0].Socket_Id), iv);
                                                            fonction.SaveMessageUser("send", msg.from, msg.to, sender.returnMessage());
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                });
                break;
            case "kick": //demande de chasser quelqu'un d'un groupe
                fonction.GetMembres(msg.group, function (data) {
                    if (data.length == 0) {
                        format = new Format("server", "error");
                        sender = new Sender(format, socket);
                        sender.complete("Le groupe " + msg.group + " n'existe pas.");
                        sender.send(null, Secret, iv);
                    }
                    else {
                        fonction.IsMember(msg.from, msg.group, function (data) {
                            if (data.length == 0) {
                                format = new Format("server", "error");
                                sender = new Sender(format, socket);
                                sender.complete("Tu n'es pas membre du groupe.");
                                sender.send(null, Secret, iv);
                            }
                            else {
                                fonction.IsMember(msg.dest, msg.group, function (data) {
                                    if (data.length == 0) {
                                        format = new Format("server", "error");
                                        sender = new Sender(format, socket);
                                        sender.complete("Il n'est pas membre du groupe.");
                                        sender.send(null, Secret, iv);
                                    }
                                    else {
                                        format = new Format("server", "kick");
                                        sender = new Sender(format, socket);
                                        sender.complete(socket.id, msg.from, msg.group, msg.dest, msg.reason);
                                        sender.send(null, Secret, iv);


                                        fonction.GetMembres(msg.group, function (data) {
                                            data.forEach(element => {
                                                format = new Format("server", "broadcastgroup");
                                                sender = new Sender(format, server);
                                                sender.complete(socket.id, msg.from, msg.group, msg.dest + " a ete expuslé du groupe -" + msg.group + "-.");
                                                if (SecretMap.get(element.Socket_Id) != undefined) {
                                                    sender.send(element.Socket_Id, SecretMap.get(element.Socket_Id), iv);
                                                }
                                                fonction.SaveMessage(msg.group, msg.from, sender.returnMessage().msg);
                                            });
                                        });
                                        fonction.RemoveMember(msg.dest, msg.group);
                                        fonction.SaveAction(msg.group, "kick", msg.from, msg.dest, msg.reason);
                                    }
                                });
                            }
                        });
                    }
                });

                break;
            case "ban": //demande de bannir quelqu'un d'un groupe
                fonction.GetMembres(msg.group, function (data) {
                    if (data.length == 0) {
                        format = new Format("server", "error");
                        sender = new Sender(format, socket);
                        sender.complete("Le groupe " + msg.group + "n'existe pas.");
                        sender.send(null, Secret, iv);
                    }
                    else {
                        fonction.IsMember(msg.from, msg.group, function (data) {
                            if (data.length == 0) {
                                format = new Format("server", "error");
                                sender = new Sender(format, socket);
                                sender.complete("Tu n'es pas membre du groupe -" + msg.group + "-.");
                                sender.send(null, Secret, iv);
                            }
                            else {
                                fonction.IsMember(msg.dest, msg.group, function (data) {
                                    if (data.length == 0) {
                                        format = new Format("server", "error");
                                        sender = new Sender(format, socket);
                                        sender.complete("Il n'est pas membre du groupe.");
                                        sender.send(null, Secret, iv);
                                    }
                                    else {
                                        format = new Format("server", "ban");
                                        sender = new Sender(format, socket);
                                        sender.complete(socket.id, msg.from, msg.group, msg.dest, msg.reason);
                                        sender.send(null, Secret, iv);


                                        fonction.GetMembres(msg.group, function (data) {
                                            data.forEach(element => {
                                                format = new Format("server", "broadcastgroup");
                                                sender = new Sender(format, server);
                                                sender.complete(socket.id, msg.from, msg.group, msg.dest + " a ete banni definitivement du groupe -" + msg.group + "-.");
                                                if (SecretMap.get(element.Socket_Id) != undefined) {
                                                    sender.send(element.Socket_Id, SecretMap.get(element.Socket_Id), iv);
                                                }

                                            });
                                        });
                                        fonction.RemoveMember(msg.dest, msg.group);
                                        fonction.Ban(msg.dest, msg.group);
                                        fonction.SaveAction(msg.group, "ban", msg.from, msg.dest, msg.reason);
                                    }
                                });
                            }
                        });
                    }
                });
                break;

            case "unban": //demande de ne plus exclure quelqu'un
                fonction.GetMembres(msg.group, function (data) {
                    if (data.length == 0) {
                        format = new Format("server", "error");
                        sender = new Sender(format, socket);
                        sender.complete("Le groupe " + msg.group + "- n'existe pas.");
                        sender.send(socket.id, Secret, iv);
                    }
                    else {
                        fonction.IsMember(msg.from, msg.group, function (data) {
                            if (data.length == 0) {
                                format = new Format("server", "error");
                                sender = new Sender(format, socket);
                                sender.complete("Tu n'es pas membre du groupe -" + msg.group + "-.");
                                sender.send(null, Secret, iv);
                            }
                            else {
                                fonction.IsBanned(msg.dest, msg.group, function (data) {
                                    if (data.length == 0) {
                                        format = new Format("server", "error");
                                        sender = new Sender(format, socket);
                                        sender.complete("Il n'a pas ete banni.");
                                        sender.send(null, Secret, iv);
                                    }
                                    else {
                                        format = new Format("server", "unban");
                                        sender = new Sender(format, socket);
                                        sender.complete(socket.id, msg.from, msg.group, msg.dest, msg.reason);
                                        sender.send(socket.id, Secret, iv);
                                        fonction.Unban(msg.dest, msg.group);

                                        fonction.GetMembres(msg.group, function (data) {
                                            data.forEach(element => {
                                                format = new Format("server", "broadcastgroup");
                                                sender = new Sender(format, server);
                                                sender.complete(socket.id, msg.from, msg.group, msg.dest + " n'est plus definitivement banni du groupe -" + msg.group + "-.");
                                                if (SecretMap.get(element.Socket_Id) != undefined) {
                                                    sender.send(element.Socket_Id, SecretMap.get(element.Socket_Id), iv);
                                                }

                                            });
                                        });
                                        fonction.SaveAction(msg.group, "unban", msg.from, msg.dest, msg.reason);
                                    }
                                });
                            }
                        });
                    }
                });
                break;
            case "states": //demande de toutes les actions du groupe
                fonction.GetActions(msg.group, function (data) {
                    let l = [];
                    data.forEach((element) => {

                        let message = JSON.stringify({ "from": element.Sender_Name, "to": element.Receiver_Name, "group": element.GroupName, "type": element.Type, "reason": element.Detail });
                        l.push(message);
                    });

                    format = new Format("server", "liststates");
                    sender = new Sender(format, socket);
                    sender.complete(socket.id, msg.from, msg.group, l.join(" , "));
                    sender.send(null, Secret, iv);
                });

                break;

            case "deldata": //demande de supprimer les données
                format = new Format("server", "deldata");
                sender = new Sender(format, socket);
                sender.complete(msg.from);
                sender.send(null, Secret, iv);
                fonction.DelData(msg.from);
                break;

            case "getdata": //demande de recuperer ses données
                format = new Format("server", "getdata");
                sender = new Sender(format, socket);
                fonction.GetData(msg.from, function (data) {
                    let l = [];

                    data.forEach((element) => {
                        let message = JSON.stringify({ "from": element.Sender_Name, "message": element.Content });
                        l.push(message);
                    });
                    sender.complete(msg.from, l);
                    sender.send(null, Secret, iv);
                });
                break;

            default:
                console.log("default");
        }

    });
    socket.on("disconnect", function () { //gestion de la deconnexion d'un client
        fonction.GetName(socket.id, function (data) {
            if (data.length != 0) {
                console.log(data[0].Name + " es déconnecté.");
            }
            else {
                console.log("Un inconnu s'est deconnecté.");
            }
        });
        SecretMap.delete(socket.id);

    });
});

server.on("disconnection", (socket) => { //en cas de deconnexion du server
    console.log("server deconnecté")
});