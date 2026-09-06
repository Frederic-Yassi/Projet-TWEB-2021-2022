const {encrypter}=require('../Modules/Func_Crypt');

 
//Ce module contient une classe permettant de generer les messages et de les envoyer 

exports.Sender=class Sender{
    constructor(format,socket){
        this.format=format;     //On recupere le format du message a envoyer 
        this.socket=socket;     //On recupere la socket qui va envoyer le message  
        this.message="";        
    }
    completeClient(params){        //Cette fonction permet de completer le format du message chez le client 

        switch(this.format.type){

            //Pour chaque format , on complete le message avec les parametres qu'il faut selon le format 
            
            case "pubKey":
                this.message=this.format.get()(params[0],params[1]);
                break;
            case "connection":
                this.message=this.format.get()(params[0],params[1]);
                break;
            case "send":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "broadcast":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "list":
                this.message=this.format.get()(params[0],params[1],params[2]); 
                break;
            case "quit":
                this.message=this.format.get()(params[0],params[1]);
                break;
        
            case "creategroupe":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "join":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "broadcastgroup":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "listmembers":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "listmessages":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "grouplist":
                this.message=this.format.get()(params[0],params[1]); 
                break;
            case "leave":
                this.message=this.format.get()(params[0],params[1]);
                break;
            case "invite":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "kick":
                this.message=this.format.get()(params[0],params[1],params[2],params[3]);
                break;
            case "ban":
                this.message=this.format.get()(params[0],params[1],params[2],params[3]);
                break;
            case "unban":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "liststates":
                this.message=this.format.get()(params[0],params[1]);
                break;
            case "deldata":
                this.message=this.format.get()(params[0]);
                break;
            case "getdata":
                this.message=this.format.get()(params[0]);
                break;
            }
    }


    complete(...params){                    //Cette fonction permet de completer le format du message chez le server  

        switch(this.format.type){
            case "pubKey":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "connection":
                this.message=this.format.get()(params[0],params[1]);
                break;
            case "send":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "broadcast":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "list":
                this.message=this.format.get()(params[0],params[1],params[2]); 
                break;
            case "quit":
                this.message=this.format.get()(params[0],params[1]);
                break;
            case "creategroupe":
                this.message=this.format.get()(params[0],params[1],params[2]);
                break;
            case "join":
                this.message=this.format.get()(params[0],params[1],params[2],params[3]);
                break;
            case "broadcastgroup":
                this.message=this.format.get()(params[0],params[1],params[2],params[3]);
                break;
            case "listmembers":
                this.message=this.format.get()(params[0],params[1],params[2],params[3]);
                break;
            case "listmessages":
                this.message=this.format.get()(params[0],params[1],params[2],params[3]);
                break;
            case "grouplist":
                this.message=this.format.get()(params[0],params[1],params[2]); 
                break;
            case "leave":
                this.message=this.format.get()(params[0],params[1],params[2]); 
                break;
            case "invite":
                this.message=this.format.get()(params[0],params[1],params[2],params[3]);
                break;
            case "kick":
                this.message=this.format.get()(params[0],params[1],params[2],params[3],params[4]);
                break;
            case "ban":
                this.message=this.format.get()(params[0],params[1],params[2],params[3],params[4]);
                break;
            case "unban":
                this.message=this.format.get()(params[0],params[1],params[2],params[3]); 
                break;
            case "liststates":
                this.message=this.format.get()(params[0],params[1],params[2],params[3]);
                break;

            case "deldata":
                this.message=this.format.get()(params[0]);
                break;
            
            case "getdata":
                this.message=this.format.get()(params[0],params[1]);
                break;

            case "error":
                this.message=this.format.get()(params[0]);
                break;
        }
    }

    send(destinataire=null,Secret=null,vector=null){                    
        //cette fonction permet d'envoyer le message apres l'avoir completer 

        //On envoie le message a un destinataire en particulier si destinataire est non null
        ///Sinon on envoie le message à celui qui l'a envoyé 


        if(this.format.statut=="client"){
            if(this.format.type=="pubKey"){
                this.socket.emit("secure",this.message);
            }
            else{
                let iv = Buffer.from(vector);//16 chars
                let buf = Buffer.from(this.message); // 32 chars
                
                let enc = encrypter(Secret, iv, buf);
                
                switch(this.format.type){
                    case "connection":
                        this.socket.emit("data",enc);
                        break;
                    case "send":
                        this.socket.emit("PrivateMessage",enc);
                        break;
                    case "broadcast":
                        this.socket.emit("BroadcastMessage",enc);
                        break;
                    case("list"):
                        this.socket.emit("data",enc);
                        break;
                    case("quit"):
                        this.socket.emit("data",enc);
                        break;
                    
                    case("deldata"):
                        this.socket.emit("data",enc);
                        break;
                    
                    case("getdata"):
                        this.socket.emit("data",enc);
                        break;

                    default :
                        this.socket.emit("GroupMessage",enc);
                        break;
                    }
                }
        }
        else{
            if( this.format.type=="pubKey"){
                    this.socket.emit("secure",this.message);
            }
            else{
                let iv = Buffer.from(vector);//16 chars
                let buf = Buffer.from(this.message); // 32 chars
                let enc = encrypter(Secret, iv, buf);
               

            
                switch(this.format.type){
                
                    case "connection":
                        this.socket.emit("authentification",enc);          
                        break;
                    case "send":
                        this.socket.to(destinataire).emit("PrivateMessage",enc);
                        break;
                    case "broadcast":
                        this.socket.to(destinataire).emit("BroadcastMessage",enc);
                        break;
                    case"list" :
                        this.socket.emit("data",enc);
                        break;
                    case "quit" :
                        this.socket.emit("data",enc); 
                        break;

                    case "deldata" :
                        this.socket.emit("data",enc);
                        break;

                    case "getdata" :
                        this.socket.emit("data",enc);
                        break;
                    
                    case("error"):
                        this.socket.emit("erreur",enc);
                        break;
                    default :
                        if(destinataire==null){
                            this.socket.emit("GroupMessage",enc);
                            break;
                        }
                        else{
                            this.socket.to(destinataire).emit("GroupMessage",enc);
                            break;
                        }
                }
            }
        }
    }

    returnMessage(){        //cette fonction permet de retourner le message pour les stocker dans la base de données
        return JSON.parse(this.message) ;
    }

}
