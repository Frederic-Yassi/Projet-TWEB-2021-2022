//Ce module contient une classe permettant de generer des messages au format JSON 

exports.Format = class Format {
    constructor(statut, type) {
        //Client ou server 
        this.statut = statut,  
        //type du message  
        this.type = type;
    }

    /*
    Cette methode retourne le message souhaité suivant les différentes caractéristiques du message.
    On differencie le cas client et le cas server car ils n'ont pas le meme format de message
    */
    get() {
        if (this.statut == "client") {
            switch (this.type) {
                //Connexion au serveur, echange de clé  
                case "pubKey":
                    return (sender_name, PubKey) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "value": PubKey,
                            "action": "pubKey"
                        });
                    }
                    break;
                //Authentification avec login et password
                case "connection":
                    return (sender_name, password) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "pwd": password,
                            "action": 'client-hello-auto',
                        });
                    }
                    break;
                //Envoi des messages privés
                case "send": 
                    return (sender_name, receiver_name, message_content) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "to": receiver_name,
                            "msg": message_content,
                            "action": 'client-send'
                        });
                    }
                    break;
                //Envoi des messages en broadcast
                case "broadcast":   
                    return (sender_name, message_content) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "to": "broadcast",
                            "msg": message_content,
                            "action": 'client-broadcast'
                        }
                        );
                    }
                    break;
                //Liste les clients
                case "list":     
                    return (sender_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "action": "client-list-clients"
                        });
                    }
                    break;
                //Deconnexion
                case "quit":        
                    return (sender_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "action": "client-quit"
                        });
                    }
                    break;
                //Création d'un groupe
                case "creategroupe":  
                    return (sender_name, group_name, state) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "public": state,
                            "action": 'cgroupe'
                        });
                    }
                    break;
                //Rejoindre un groupe
                case "join":           
                    return (sender_name, group_name, invited) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "invited": invited,
                            "action": 'join'
                        });
                    }
                    break;
                //Envoyer un message à un groupe
                case "broadcastgroup":  
                    return (sender_name, group_name, message_content) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "msg": message_content,
                            "action": 'gbroadcast'
                        });
                    }
                    break;
                //Lister les membres d'un groupe
                case "listmembers":   
                    return (sender_name, group_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "action": 'members'
                        });
                    }
                    break;
                //Lister les messages d'un groupe
                case "listmessages":   
                    return (sender_name, group_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "action": 'msgs'
                        });
                    }
                    break;
                //Lister les groupes
                case "grouplist":       
                    return (sender_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "action": 'groups'
                        });
                    }
                    break;
                //Quitter un groupe
                case "leave":          
                    return (sender_name, group_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "action": 'leave'
                        });
                    }
                    break;
                //Inviter quelqu'un à rejoindre un groupe
                case "invite":       
                    return (sender_name, group_name, receiver_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "dest": receiver_name,
                            "action": 'invite'
                        });
                    }
                    break;
                //Expulser quelqu'un d'un groupe
                case "kick": 
                    return (sender_name, group_name, receiver_name, reason) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "dest": receiver_name,
                            "reason": reason,
                            "action": 'kick'
                        });
                    }
                    break;
                //Exclure quelqu'un d'un groupe
                case "ban":
                    return (sender_name, group_name, receiver_name, reason) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "dest": receiver_name,
                            "reason": reason,
                            "action": 'ban'
                        });
                    }
                    break;
                //Ne plus exclure quelqu'un d'un groupe
                case "unban": 
                    return (sender_name, group_name, receiver_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "dest": receiver_name,
                            "action": 'unban'
                        });
                    }
                    break;
                //Recuperer les evenements d'un groupe
                case "liststates": 
                    return (sender_name, group_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "group": group_name,
                            "action": 'states'
                        });
                    }
                    break;
                //supprimer les messages privés d'un utilisateur
                case "deldata":
                    return (sender_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "action": 'deldata'
                        });
                    }
                    break;
                //recuperer les messages privés d'un utilisateur
                case "getdata":
                    return (sender_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "action": 'getdata'
                        });
                    }
                    break;
            }
        }
        else {
            switch (this.type) {
                //Connexion au serveur, echange de clé 
                case "pubKey":  
                    return (sender_name, PubKey, iv) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "value": PubKey,
                            "iv": iv,
                            "action": "pubKey",
                        });
                    }
                    break;
                //Authentification
                case "connection":
                    return (sender_name, accord) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "action": 'server-hello',
                            "accord": accord,
                        });
                    }
                    break;
                //Envoi des messages privés 
                case "send":
                    return (id, sender_name, message_content) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "action": "client-send",
                            "msg": "-- From " + sender_name + " : " + message_content,
                        });
                    }
                    break;
                //Envoi des messages en broadcast
                case "broadcast":
                    return (id, sender_name, message_content) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "action": "client-broadcast",
                            "msg": "-- From " + sender_name + " : " + message_content,
                        });
                    }
                    break;
                //Liste les clients
                case "list":
                    return (id, sender_name, liste) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "action": "client-list-clients",
                            "msg": "Voici la liste des clients : " + liste,
                        });
                    }
                    break;
                //Déconnexion
                case "quit":
                    return (id, sender_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "action": "client-quit",
                            "msg": "You are disconnected, bye.",
                        });
                    }
                    break;
                //Création d'un groupe
                case "creategroupe":
                    return (id, sender_name, group_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "action": 'cgroupe',
                            "msg": "Le groupe -" + group_name + "- a été créé, et vous êtes dedans.",
                        });
                    }
                    break;
                //Rejoindre un groupe
                case "join":
                    return (id, sender_name, group_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "action": 'join',
                            "msg": "Vous avez rejoint le groupe -" + group_name + "-."
                        });
                    }
                //Envoi un message au groupe en question
                case "broadcastgroup":
                    return (id, sender_name, group_name, message_content) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "msg": "-- " + group_name + "/" + sender_name + " : " + message_content,
                            "action": 'gbroadcast'
                        });
                    }
                    break;
                //Liste les membres du groupe en question
                case "listmembers":
                    return (id, sender_name, group_name, liste) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "msg": "Voici la liste des membres du groupe -" + group_name + "- : " + liste,
                            "action": 'members'
                        });
                    }
                    break;
                //Liste les messages du groupe en question
                case "listmessages":
                    return (id, sender_name, group_name, liste) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "msg": "Voici les messages du groupe -" + group_name + "- : " + liste,
                            "action": 'msg'
                        });
                    }
                    break;
                //Liste les groupes
                case "grouplist":
                    return (id, sender_name, liste) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "msg": "Voici la liste des groupes : " + liste,
                            "action": 'groups'
                        });
                    }
                    break;
                //Quitte le groupe en question
                case "leave":
                    return (id, sender_name, group_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "msg": "Tu as quitté le groupe " + group_name,
                            "action": 'leave'
                        });
                    }
                    break;
                //Invite un client a rejoindre un groupe
                case "invite":
                    return (id, sender_name, group_name, receiver_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "dest": receiver_name,
                            "msg": " -- " + sender_name + " t'a invité à rejoindre le groupe -" + group_name + "-. Appuie sur ENTREE pour faire ton choix.",
                            "action": 'invite'
                        });
                    }
                    break;
                //Expulser quelqun'un d'un groupe
                case "kick":
                    return (id, sender_name, group_name, receiver_name, reason) => {
                        return JSON.stringify({
                            "sender": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "dest": receiver_name,
                            "msg": "Tu as expulsé " + receiver_name + "du groupe -" + group_name + "-.",
                            "reason": reason,
                            "action": 'kick'
                        });
                    }
                    break;
                //Exclure quelqun'un d'un groupe
                case "ban":
                    return (id,sender_name, group_name, receiver_name, reason) => {
                        return JSON.stringify({
                            "sender": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "dest": receiver_name,
                            "msg": "Tu as banni " + receiver_name + " du groupe -" + group_name + "-.",
                            "reason": reason,
                            "action": 'ban'
                        });
                    }
                    break;
                //Ne plus exclure quelqun'un d'un groupe
                case "unban":
                    return (id,sender_name, group_name, receiver_name) => {
                        return JSON.stringify({
                            "sender": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "dest": receiver_name,
                            "action": 'unban'
                        });
                    }
                    break;
                //Recupérer les evenements d'un groupe
                case "liststates":
                    return (id,sender_name, group_name, liste) => {
                        return JSON.stringify({
                            "sender": sender_name,
                            "sender-id": id,
                            "group": group_name,
                            "msg": "Voici tous les évênements du groupe -" + group_name + " : " + liste,
                            "action": 'states'
                        });
                    }
                    break;
                //supprimer les messages privés d'un utilisateur    
                case "deldata":
                    return (sender_name) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "action": 'deldata',
                            "msg": "Suppression effectuéé"
                        });
                    }
                    break;
                //recuperer les messages privés d'un utilisateur    
                case "getdata":
                    return (sender_name, data) => {
                        return JSON.stringify({
                            "from": sender_name,
                            "action": 'getdata',
                            "msg": data,
                        });
                    }
                    break;
                case "error":
                    return (msg) => {
                        return JSON.stringify({
                            "from": "server",
                            "msg": msg,
                            "action": 'error'
                        });
                    }
                    break;
            }
        }
    }
}