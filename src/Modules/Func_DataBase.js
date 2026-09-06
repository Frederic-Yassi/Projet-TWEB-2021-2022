/*Ce module contient toutes les fonctions permettant d'interagir avec 
    avec la base de données

*/

const sqlite3= require("sqlite3");
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.CreateDatabase=function (){ //creation de la bd
    let db = new sqlite3.Database("Main.db", err=>{
        if(err){
            throw err
        }

        db.run("CREATE TABLE Users (Date date DEFAULT CURRENT_TIMESTAMP ,Socket_Id  varchar(100)  NOT NULL , Name varchar(10) PRIMARY KEY NOT NULL ,Password varchar(255) )");
        db.run("CREATE TABLE Groups (Date date DEFAULT CURRENT_TIMESTAMP, Id INTEGER PRIMARY KEY  AUTOINCREMENT, Name varchar(10) NOT NULL,GroupName varchar(10) NOT NULL,Public varchar(5) NOT NULL )");
        db.run("CREATE TABLE Banned (Date date DEFAULT CURRENT_TIMESTAMP, Id INTEGER PRIMARY KEY  AUTOINCREMENT, Name varchar(10) NOT NULL,GroupName varchar(10) NOT NULL)");
        db.run("CREATE TABLE Messages (Date date DEFAULT CURRENT_TIMESTAMP, Id_msge INTEGER PRIMARY KEY  AUTOINCREMENT, Type varchar(10) NOT NULL,Sender_Name varchar(10) NOT NULL,Receiver_Name varchar(10) NOT NULL,Content varchar(255) NOT NULL )");
        db.run("CREATE TABLE Messages_group (Date date DEFAULT CURRENT_TIMESTAMP, Id_msge_gp INTEGER PRIMARY KEY  AUTOINCREMENT,GroupName varchar(10) NOT NULL,Sender_Name varchar(10) NOT NULL,Content varchar(255) NOT NULL)");
        db.run("CREATE TABLE Action_group (Date date DEFAULT CURRENT_TIMESTAMP , Id_action INTEGER PRIMARY KEY  AUTOINCREMENT,GroupName varchar(10) NOT NULL,Type varchar(10) NOT NULL,Sender_Name varchar(10) NOT NULL,Detail varchar(255) NOT NULL,Receiver_Name varchar(10) NOT NULL)");

        db.close(err=>{
            if(err){
                throw err
            }
        })
    });
}

exports.Empty=function Empty(){ //vide la base de données
    let db = new sqlite3.Database("Main.db", err=>{
        if(err){
            throw err
        }
        db.run(`DELETE FROM Users `);
        db.run(`DELETE FROM Groups`);
        db.run(`DELETE FROM Messages`);
        db.run(`DELETE FROM Messages_Group `);
        db.run(`DELETE FROM Action_group `);
        db.run(`DELETE FROM Banned `);

        
        
        db.close(err=>{
            if(err){
                throw err
            }
        })
    });
}


exports.ShowTable=function (nom){  //affiche une table
    let db = new sqlite3.Database("Main.db", err=>{
        if(err){
            throw err
        }
        db.all(`SELECT * FROM ${nom} `,(err,data)=>{
            if(err){
                throw err 
            }
            console.log(data);
        });
        db.close(err=>{
            if(err){
                throw err
            }
        })
    });
}


exports.SaveUser=function (id,nom,Password){ //enregistre un utilisateur dans la bd
    let db = new sqlite3.Database("Main.db", err=>{
        if(err){
            throw err
        }
        bcrypt.hash(Password, saltRounds, function(err, hash) {
            db.run(`INSERT INTO Users(Socket_Id,Name,Password) VALUES("${id}","${nom}","${hash}")`); 
           
            db.close(err=>{
                if(err){
                    throw err
                }
            })
           
        });
    
    });
};

exports.Authentification=function(nom,pwd,f){//verifie l'identité du client
    let db = new sqlite3.Database("Main.db", err=>{
        if(err){
            throw err
        }
        db.all(`SELECT Password FROM Users WHERE Name="${nom}" `,(err,data)=>{
            if(err){
                throw err 
            }
            
            bcrypt.compare(pwd, data[0].Password, function(err, result) {
                f(result);
            });
        });
       
        db.close(err=>{
            if(err){
                throw err
            }
        })
    
    });
};


exports.GetUser = function (nom,f){       //Obtenir les informations d'un utilisateur
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT * FROM Users WHERE Name="${nom}" `,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.GetName=function (id,f){ //Obtenir le nom d'un utilisateur 
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT Name FROM Users WHERE Socket_Id="${id}" `,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.GetId=function (Name,f){ //Obtenir l'id d'un utilisateur 
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT Socket_Id FROM Users WHERE Socket_Id="${Name}" `,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}



exports.GetAllUser=function (f){        //Obtenir la liste des utilisateurs 
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT * FROM Users `,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.RemoveUser=function RemoveUser(nom){    //supprimer un utilisateur
    let db = new sqlite3.Database("Main.db", err=>{
    if(err){
        throw err
    }
    db.run(`DELETE FROM Users WHERE Name="${nom}"`);
    db.close(err=>{
        if(err){
            throw err
        }
    })
});
}



exports.SaveGroup=function (nom,gnom,public){  //faire un enregistrement d'un groupe
    if(public==undefined){
        public="No";
    }
    let db = new sqlite3.Database("Main.db", err=>{
        if(err){
            throw err
        }
        db.run(`INSERT INTO Groups(Name,GroupName,Public) VALUES("${nom}","${gnom}","${public}")`);
        db.close(err=>{
            if(err){
                throw err
            }
        })
    });
}

exports.GetAllGroup=function (f){  //obtenir la liste des groupes 
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT DISTINCT GroupName FROM Groups `,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}


exports.GetMembres=function (nom,f){//obtenir les membres d'un groupe
    
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });
    
    db.all(`SELECT Users.Name,Users.Socket_Id FROM Users inner join Groups on Groups.Name=Users.Name  WHERE GroupName ="${nom}" `,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.GetActions=function (gnom,f){///obtenier les actions dans un groupe
    
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });
    
    db.all(`SELECT * FROM Action_Group WHERE GroupName ="${gnom}" `,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.IsMember=function(nom,gnom,f){ //verifie si le client est membre dans un groupe

    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT Name FROM Groups WHERE Name="${nom}" AND GroupName ="${gnom}" `,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });

}

exports.IsBanned=function(nom,gnom,f){//verifie si le client a ete banni d'un groupe
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT * FROM Banned WHERE GroupName ="${gnom}" AND Name="${nom}"`,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.Unban=function(nom,gnom){//retirer de la liste noire
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.run(`DELETE FROM Banned WHERE GroupName ="${gnom}" AND Name="${nom}"`);        

    db.close(err=>{
        if(err){
            throw err
        }
    });
}


exports.GetMessages=function(nom,f){ //obtenir les messages d'un groupe 
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT * FROM Messages_Group WHERE GroupName ="${nom}" `,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.GetData=function(nom,f){//obtenir les messages 
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT * FROM Messages WHERE Sender_Name ="${nom}" OR Receiver_Name="${nom}"`,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}


exports.SaveAction=function(gnom,t,nom,nomto,d){ //enregistrer un action d'un groupe
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });
    db.run(`INSERT INTO Action_Group (GroupName,Type,Sender_Name,Receiver_Name,Detail) VALUES("${gnom}","${t}","${nom}","${nomto}","${d}")`),
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.SaveMessageUser=function(t,nom,nomto,message){ //enregistrer les messages privées
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });
    db.run(`INSERT INTO Messages (Type,Sender_Name,Receiver_Name,Content) VALUES("${t}","${nom}","${nomto}","${message}")`),
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.SaveMessage=function(gnom,nom,message){//enregistre les messages du groupe
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.run(`INSERT INTO Messages_Group(GroupName,Sender_Name,Content) VALUES("${gnom}","${nom}","${message}")`),
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.RemoveMember=function(nom,gnom){//supprime un membre d'un groupe
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.run(`DELETE FROM Groups WHERE GroupName="${gnom}"  AND  Name="${nom}" `);
    
    db.close(err=>{
        if(err){
            throw err
        }
    });
}

exports.DelData=function(nom){//supprime les messages privées d'un groupe
    let db = new sqlite3.Database("Main.db", err=>{
        if(err){
            throw err
        }
        db.run(`DELETE FROM Messages where Sender_Name="${nom}" `);
        db.close(err=>{
            if(err){
                throw err
            }
        })
    });
}

exports.Ban=function (nom,gnom){ //enregistre un utilisateur banni
    let db = new sqlite3.Database("Main.db", err=>{
        if(err){
            throw err
        }
      
       
        db.run(`INSERT INTO Banned(GroupName,Name) VALUES("${gnom}","${nom}")`); 
           
        db.close(err=>{
            if(err){
                throw err
            }
        })
    
    });
};
exports.ChangeId=function (id,New_id){  //permet de mettre a jour les Socket.id
    let db = new sqlite3.Database("Main.db", err=>{
    if(err){
        throw err
    }
    db.run(`UPDATE Users SET Socket_Id = "${New_id}"  WHERE Socket_Id = "${id}" `);
    db.close(err=>{
        if(err){
            throw err
        }
    })
});
}

exports.GetPublic=function(nom,f){ //savoir si un groupe est public ou pas
    let db = new sqlite3.Database("Main.db",err=>{
        if(err){
            throw err
        }
    });

    db.all(`SELECT Public FROM Groups WHERE GroupName ="${nom}"`,(err,data)=>{
        if(err){
            throw err 
        }
        f(data);
    });
    
    db.close(err=>{
        if(err){
            throw err
        }
    });

}