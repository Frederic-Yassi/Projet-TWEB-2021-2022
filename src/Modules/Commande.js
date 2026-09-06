const { Format } = require('./FormatMessage');
const { Sender } = require('./SendMessage');

/*  
Ce module permet d'identifier les commandes saisies,
de generer les formats de message correspondant et 
de les envoyer directement au server
*/

exports.Command = class Command {
    constructor(name, ...params) {
        this.name = name;
        this.format;
        this.sender;
    }

    //Cette fonction permet de generer le message et de l'envoyer
    execute(socket, sender_name, params, secret, iv) {
        this.format = new Format("client", this.name);
        this.sender = new Sender(this.format, socket);
        params[0] = sender_name;
        this.sender.completeClient(params);
        this.sender.send(null, secret, iv);
    }

    //Cette fonction permet de récupérer et de traiter la commande saisi
    static getCommandPar(texte) {
        if (texte == null || String(texte).trim() === '') {
            return '';
        }
        //s;david;hello     
        if (texte.slice(0, 2) == "s;") {
            texte = texte.split(";");
            if (texte.length == 3) {
                return ["send", texte[1], texte[2]];
            } else {
                return "error";
            }
        }
        //b;hello
        if (texte.slice(0, 2) == "b;") {
            texte = texte.split(";");
            if (texte.length == 2) {
                return ["broadcast", texte[1]];
            } else {
                return "error";
            }
        }
        //ls;
        if (texte == "ls;") {
            return ["list"];
        }
        //q;
        if (texte == "q;") {
            return ["quit"];
        }
        //cg;wob
        if (texte.slice(0, 3) == "cg;") {
            texte = texte.split(";");
            if (texte.length == 2 || texte.length == 3) {
                if (texte[2] == "" || texte[2] == undefined) {
                    texte[2] = "yes";
                }
                return ["creategroupe", texte[1], texte[2]];
            } else {
                return "error";
            }
        }
        //j;wob
        if (texte.slice(0, 2) == "j;") {
            texte = texte.split(";");
            if (texte.length == 2) {
                return ["join", texte[1]];
            } else {
                return "error";
            }
        }
        //bg;wob;hello
        if (texte.slice(0, 3) == "bg;") {
            texte = texte.split(";");
            if (texte.length == 3) {
                return ["broadcastgroup", texte[1], texte[2]];
            } else {
                return "error";
            }
        }
        //members;wob
        if (texte.includes("members;")) {
            texte = texte.split(";");
            if (texte.length == 2) {
                return ["listmembers", texte[1]];
            } else {
                return "error";
            }
        }
        //messages;wob
        if (texte.includes("messages;")) {
            texte = texte.split(";");
            if (texte.length == 2) {
                return ["listmessages", texte[1]];
            } else {
                return "error";
            }
        }
        //groups;
        if (texte == "groups;") {
            return ["grouplist"];
        }
        //leave;wob
        if (texte.includes("leave;")) {
            texte = texte.split(";");
            if (texte.length == 2) {
                return ["leave", texte[1]];
            } else {
                return "error";
            }
        }
        //invite;wob;david
        if (texte.includes("invite;")) {
            texte = texte.split(";");
            if (texte.length == 3) {
                return ["invite", texte[1], texte[2]];
            } else {
                return "error";
            }
        }
        //kick;wob;david;reason
        if (texte.includes("kick;")) {
            texte = texte.split(";");
            if (texte.length == 4) {
                return ["kick", texte[1], texte[2], texte[3]];
            } else {
                return "error";
            }
        }
        //ban;wob;david;reason
        if ((texte.slice(0, 4)) == "ban;") {
            texte = texte.split(";");
            if (texte.length == 4) {
                return ["ban", texte[1], texte[2], texte[3]];
            } else {
                return "error";
            }
        }
        //unban;wob;david
        if (texte.includes("unban;")) {
            texte = texte.split(";");
            if (texte.length == 3) {
                return ["unban", texte[1], texte[2]];
            } else {
                return "error";
            }
        }
        //states;wob
        if (texte.includes("states;")) {
            texte = texte.split(";");
            if (texte.length == 2) {
                return ["liststates", texte[1]];
            } else {
                return "error";
            }
        }
        //deldata;
        if (texte.includes("deldata;")) {
            return ["deldata"];
            
        }
        //getdata
        if (texte.includes("getdata;")) {
            return ["getdata"];
            
        }
        else {
            return "error";
        }

    }
}