var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs'),
    session = require('cookie-session'),
    bodyParser = require('body-parser'),
	MongoClient = require("mongodb").MongoClient,
	User = require(".././user.js"),
	mongoose = require('mongoose'),
	passport = require('passport'),
	twitchStrategy = require("passport-twitch").Strategy;

app.use(express.static(__dirname + '/public'));

mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connection réussi à la base de données !")
});


passport.use(new twitchStrategy({
    clientID: 'fyqq9b11cy3og1tt0lir4zkd8nzqa7',
    clientSecret: '9q8o54feh96o3selxzl80ztmn7i291',
    callbackURL: "http://62.210.219.88:8080/oauth/callback/twitch",
    scope: "user_read"
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));


// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());



passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Chargement de la page index.html
app.get('/',
	require('connect-ensure-login').ensureLoggedIn('/login'),
	function (req, res) {
  res.render('index.ejs', {
       title: 'Charly Esteve  - Développeur Web',
	   user: req.user
      });
});

app.get('/login',
  	function(req, res){
    /*console.log('ENV');
    console.log(process.env);
    console.log('Headers:');
    console.log(req.headers);*/
    res.render('login.ejs', {
       title: 'Login',
	});
  });


app.get("/login/twitch", passport.authenticate("twitch"));
app.get("/oauth/callback/twitch", passport.authenticate("twitch", { failureRedirect: "/login" }), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
});

// Chargement de la page index.html
app.get('/inventaire', 
	require('connect-ensure-login').ensureLoggedIn('/login'),
	function (req, res) {
  res.render('inventaire.ejs', {
       title: 'Inventaire',
	   user: req.user
      });
});

// Chargement de la page index.html
app.get('/programmation', 
	require('connect-ensure-login').ensureLoggedIn('/login'),
	function (req, res) {
  res.render('calendar.ejs', {
       title: 'Programmation',
	   user: req.user
      });
});

app.get('/arene', 
	require('connect-ensure-login').ensureLoggedIn('/login'),
	function (req, res) {
  res.render('arene.ejs', {
       title: 'Arene de combat',
	   user: req.user
      });
});


app.use(function(req, res){
  res.sendStatus(404);
  //res.status(400);
})

app.use(function(req, res){
  res.sendStatus(500);
  //res.status(500);
})

io.sockets.on('connection', function (socket) {

	console.log("Un client vient de se connecter !");

	
	socket.on('getuser', function (message) {
        message = ent.encode(message);
		getUserLevel(message, (userDoc, mdr) =>{
					console.log(userDoc.inventory);
			
					if(mdr != true){
						socket.emit('giveuser', {pseudo: userDoc.name, kamas: userDoc.argent, niveau: userDoc.level, exp: userDoc.experience, inventory: userDoc.inventory});
					}else{
						socket.emit('errorlol');
					}
			    });
        
    }); 
	
	socket.on('getuserconnection', function (user) {
		{
			getUserLevel(user, (userDoc, mdr) =>{
					console.log(userDoc.inventory);
					if(mdr != true){
						socket.emit('giveuser', {pseudo: userDoc.name, kamas: userDoc.argent, niveau: userDoc.level, exp: userDoc.experience, inventory: userDoc.inventory});
					}else{
						socket.emit('errorlol');
					}
			    });
		}
		
        
    });
	
	socket.on('equipStuff', function (stuff, user, inventory) {
				console.log(user);
				console.log(stuff.equiped);
				/*let query = {'name': user};
				let newvalues = { $set: {
					inventory: inventory
					}
				};
				User.updateOne(query, newvalues, function(err, res) {
					if (err) throw err;
					console.log("1 document updated");
				});*/
        
    });
});

/* getUserLevel(user['display-name'], (userDoc) =>{
					userDoc.experience = userDoc.experience + 1;
			        client.action(channel, user['display-name'] +" est niveau " + userDoc.level + " - Expérience : " + userDoc.experience + "/" + getMaximumExpByLevel(userDoc.level));
			    }); */

function getUserLevel(user, callback){
    let query = {'name': user};
    User.findOne(query, function(err, userDoc, mdr){
        if (err) console.log("Err while finding user experience : " , err);
        if(userDoc) {
            callback(userDoc)
        }
		if(!userDoc){
			mdr = true;
			callback(mdr)
		}
    });
}

server.listen(8080);