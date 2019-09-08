const tmi = require('tmi.js'),
	  prefix = "!",
	  reactions = require('./reactions.js'),
	  User = require("./user.js"),
	  Jeu = require("./jeu.js"),
	  MongoClient = require("mongodb").MongoClient,
	  mongoose = require('mongoose');

const tmiConfig = {
    options: {
        debug: true
    },
    connection: {
        reconnect:  true
    },
    identity: {
        username: "DehairaBot",
        password: "oauth:g3l4x0z52nym1ytyf07l66opg9mgor",
        clientId: "au1wslh7l15p6gqxkumjhdk8pr80mc"
    },
    channels: [
        "dehairka"
    ]
};

mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connection réussi à la base de données !")
});

//var silence = new Jeu({ enCours: false, joueurUn: "inconnu", joueurDeux: "inconnu", resultat: 0 });
//console.log(silence.resultat); // 'Silence'

let client = new tmi.client(tmiConfig);

client.connect();



client.on('connected', (adress, port) => {
    console.log(client.getUsername() + " s'est connecté sur : " + adress + ", port : " + port);
    client.say("dehairka", "Salut tout l'monde ! Je suis un vrai humain Kappa");
	//setInterval(rappelInfo(getRandomInt(3), "dehairka"), 500000);
});

client.on('chat', (channel, user, message, isSelf) => {
    if (isSelf) return;

    let fullCommand = commandParser(message);
    
    if(fullCommand){
        let command = fullCommand[1];
        let param = fullCommand[2];

        switch(command){
            case "bonjour":
                client.action(channel, "Bonjour à toi " + user['display-name']);
                break;
            case "twitter":
                client.action(channel, "Retrouve moi sur Twitter @Dehairka pour être au courant de mes prochains streams ! https://twitter.com/Dehairka");
                break;
            case "discord":
                client.action(channel, "Rejoins-nous sur notre Discord pour discuter de tout et de rien ! <Ceci est un lien>");
                break;
            case "uptime":
                getChannelInfo((channelDoc) => {
                			if(channelDoc.started_at == undefined){
                				client.action(channel, "Le stream est offline, merci de revenir plus tard et de me suivre sur les réseaux sociaux pour être au courant des prochains streams ! (!twitter - !discord)")
                			}else{
                				client.action(channel, "Le stream a commencé le " + channelDoc.started_at);
                			}
                });
                break;
            case "loto":
			   if(isModerator(user) || isBroadcaster(user)){
			        getChatters(channel.substr(1).toLowerCase(), (chattersList) => {
			            var randomUserIndex = Math.floor(Math.random() * (chattersList.chatters.viewers.length));
			            getUserInfo(chattersList.chatters.viewers[randomUserIndex], (winningUser) => {
			                client.action(channel, "GivePLZ " + winningUser.name + " est le gagnant du concours !! Félicitations !! TakeNRG");
			                //client.whisper(user['display-name'], winningUser.name + " est donc le gagnant de ton concours. Voici sa biographie :" + winningUser.bio);
			            });
			        });
			    } else {
			        client.whisper(user['display-name'], "Désolé, vous n'avez pas la permission d'utiliser cette commande.");
			    }
				break;
			case "speedgame":
				getChatters(channel.substr(1).toLowerCase(), (chattersList) => {
						var joueur = chattersList.chatters.viewers.indexOf(param.trim());
					if(joueur != -1){
						if(param.trim() === chattersList.chatters.viewers[joueur].trim() && user['display-name'] != param.trim() ){

			            	client.action(channel, user['display-name'] + " défi " + param + " dans un jeu de rapidité ! Tape la commande !ok pour accepter son défi !");
			            	paramJoueur = param.trim();
			            	commencerJeu(user['display-name'], paramJoueur);
			        	}else{
			        		client.action(channel, user['display-name'] +" , aucun joueur de ce nom n'a était trouvé (Ne pas mettre d'@ avant le pseudo du joueur)");
			        	}
			        }else if(chattersList.chatters.moderators.indexOf(param.trim()) != -1){
			        	client.action(channel, user['display-name'] +" , vous ne pouvez pas défier un membre du staff.");
			        }else{
			        	client.action(channel, user['display-name'] +" , aucun joueur de ce nom n'a était trouvé (Ne pas mettre d'@ avant le pseudo du joueur)");			        	
			        }
			        });
                break;
            case "ok":
            	getGameInfo("Calcul", (jeuDoc) =>{
					if(jeuDoc.joueurDeux == user['display-name']){
						var number1 = getRandomInt(100);
						var number2 = getRandomInt(100);
						var number3 = getRandomInt(100);
						var resultat = number1 + number2 + number3;
						commencerJeuCalcul(resultat);
	            		client.say(channel, "C'EST PARTI ! Combien font : " + number1 + " + " + number2 + " + " + number3 + " ! ");	            		
	            	}else{
	            		client.action(channel, "Aucun jeu en cours.");
	            	}    
				});
            	
            	break;
            case "rank":
			    getUserLevel(user['display-name'], (userDoc) =>{
					userDoc.experience = userDoc.experience + 1;
			        client.action(channel, user['display-name'] +" est niveau " + userDoc.level + " - Expérience : " + userDoc.experience + "/" + getMaximumExpByLevel(userDoc.level));
			    }); 
			break;
			case "kamas":
			    getUserLevel(user['display-name'], (userDoc) =>{
			        client.action(channel, user['display-name'] +" a " + userDoc.argent + " kamas !");
			    }); 
			break;
            default:
            	if(isBroadcaster(user)){
                	client.action(channel, "T\'es srx frr ?! Tu m'as codé et tu sais même pas m\'utiliser tu fais pitié NotLikeThis");
                }else{
                	client.action(channel, "Commande '" + command + " non reconnue. Tapez " + prefix + "help pour la liste des commandes de " + client.getUsername());
	
                }
        }
    }else{
    	let words = message.split(" ");
			for(let word of words) {
			    let reaction = reactions[word];
			    if(reaction){
			        client.say(channel, reaction);
			    }
			}
    }

    getGameInfo("Calcul", (jeuDoc) =>{
			if (jeuDoc.enCours == true && (jeuDoc.joueurUn == user['display-name'] || jeuDoc.joueurDeux == user['display-name'] )) {
		    	if(message == jeuDoc.resultat){
		    		client.say(channel, "Félicitations ! "+ user['display-name'] + " a trouvé la bonne réponse et gagne 200 kamas !");
		    		finDuJeu("Calcul", user['display-name']);
		    	}
		    }
	}); 

    updateExperience(user['display-name'], channel);
    
});



function rappelInfo(number, channel){
	switch(number){
		case 0:
			client.action(channel, "Rejoins-nous sur notre Discord pour discuter de tout et de rien ! <Ceci est un lien>");
		break;
		case 1:
			client.action(channel, "Retrouve moi sur Twitter @Dehairka pour être au courant de mes prochains streams ! https://twitter.com/Dehairka");
		break;
		case 2:
			client.action(channel, "J'espère que tu apprécies le stream ! :D Si c'est le cas, n'hésite pas à me follow pour recevoir une notification quand je suis en ligne ! SeemsGood ");
		break;
	}
}
function commandParser(message){
    let prefixEscaped = prefix.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    let regex = new RegExp("^" + prefixEscaped + "([a-zA-Z]+)\s?(.*)");
    return regex.exec(message);
}
function isSubscriber(user){
    return user.subscriber;
}
function isModerator(user){
    return user.mod;
}
function isBroadcaster(user){
    return user.badges.broadcaster == '1';
}
function getChatters(channel, callback){
    client.api({
        url: "http://tmi.twitch.tv/group/user/" + channel + "/chatters",
        method: "GET"
    }, function(err, res, body) {
        callback(body);
    });
}
function getUserInfo(username, callback){
    client.api({
        url: "https://api.twitch.tv/kraken/users/" + username,
        method: "GET",
        headers: {
            "Accept": "application/vnd.twitchtv.v3+json",
            "Authorization": tmiConfig.identity.password,
            "Client-ID": tmiConfig.identity.clientId
        }
    }, function(err, res, body) {
        callback(body);
    });
}
function getChannelInfo(callback){
    client.api({
        url: "https://api.twitch.tv/kraken/users/dehairka",
        method: "GET",
        headers: {
            "Accept": "application/vnd.twitchtv.v3+json",
            "Authorization": tmiConfig.identity.password,
            "Client-ID": tmiConfig.identity.clientId
        }
    }, function(err, res, body) {
        callback(body);
    });
}
function getMaximumExpByLevel(level){
    return level*5;
}
function getUserLevel(user, callback){
    let query = {'name': user};
    User.findOne(query, function(err, userDoc){
        if (err) console.log("Err while finding user experience : " , err);
        if(userDoc) {
            callback(userDoc)
        }
    });
}
function changeUserGame(user){
	let query = {'name': user};
	let newvalues = { $set: {game: true } };
    User.updateOne(query, newvalues, function(err, res) {
	    if (err) throw err;
	    console.log("1 document updated");
    });
}
function changeUserGameFalse(user){
	let query = {'name': user};
	let newvalues = { $set: {game: false } };
    User.updateOne(query, newvalues, function(err, res) {
	    if (err) throw err;
	    console.log("1 document updated");
    });
}
function updateExperience(user, channel){
    let query = {'name': user};
    User.findOneAndUpdate(query, { $inc: { experience: 1 }}, {upsert:true,  setDefaultsOnInsert: true, new: true}, function(err, userDoc){
        if (err) console.log("Err while updating experience : " , err);
        if(userDoc.experience >= getMaximumExpByLevel(userDoc.level)){
            userDoc.experience = 0;
            userDoc.level++;
            userDoc.save((errLevel) => {
                if (errLevel) console.log("Err while updating level : " , errLevel);
                if(!errLevel){
                    client.action(channel, "CurseLit " + userDoc.name + " vient de passer niveau " + userDoc.level + " !");
                }
            });
        }
    });
}
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
function getResultat(message){
	Jeu.findOne({ resultat: message }, function (err, jeux) {
	  if (err) return console.error(err);
	  console.log(jeux.resultat);
	  return jeux.resultat
	})

}
function changeResultat(res){
	var myquery = { resultat: 44 };
	var newvalues = { $set: {resultat: res } };
	Jeu.findOneAndUpdate(myquery, newvalues, {upsert:true,  setDefaultsOnInsert: true}, function(err, res) {
	  if (err) throw err;
	  console.log("resultat updated");
	  console.log("Askip le resultat est : "+ res);
	});
}
function commencerJeu(joueurUn, joueurDeux){
	var myquery = { 'nom': "Calcul" };
	var newvalues = { $set: {joueurUn: joueurUn, joueurDeux: joueurDeux } };
	Jeu.findOneAndUpdate(myquery, newvalues, {upsert:true,  setDefaultsOnInsert: true}, function(err, res) {
	  if (err) throw err;
	  console.log("game updated");
	  console.log("Les joueurs " + joueurUn + " et " + joueurDeux + " sont inscrit !");
	});
}
function commencerJeuCalcul(resultat){
	var myquery = { 'nom': "Calcul" };
	var newvalues = { $set: { enCours: true, resultat: resultat } };
	Jeu.findOneAndUpdate(myquery, newvalues, {upsert:true,  setDefaultsOnInsert: true}, function(err, res) {
	  if (err) throw err;
	  console.log("resultat updated");
	  console.log("Le resultat est : " + resultat);
	});
}
function getGameInfo(nom, callback){
    let query = {'nom': "Calcul"};
    Jeu.findOne(query, function(err, jeuDoc){
        if (err) console.log("Err while finding user experience : " , err);
        if(jeuDoc) {
            callback(jeuDoc)
        }
    });
}
function finDuJeu(nom, gagnant){
	var myquery = { 'nom': "Calcul" };
	var newvalues = { $set: { enCours: false, joueurUn: "inconnu", joueurDeux: "inconnu", resultat: 0 } };
	Jeu.findOneAndUpdate(myquery, newvalues, {upsert:true,  setDefaultsOnInsert: true}, function(err, res) {
	  if (err) throw err;
	  console.log("jeu terminé !");
	});

let query = {'name': gagnant};
	User.findOneAndUpdate(query, { $inc: { argent: 200 }}, {upsert:true,  setDefaultsOnInsert: true}, function(err, userDoc){
        if (err) console.log("Err while updating experience : " , err);

    });
}