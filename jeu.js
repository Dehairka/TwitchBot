var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var jeuSchema = new Schema({
  nom: { type: String, default: "Calcul" },
  enCours: { type: Boolean, default: false },
  joueurUn: { type: String, default: "inconnu" },
  joueurDeux: { type: String, default: "inconnu" },
  resultat: { type: Number, default: 0 },
});

var JeuModel = mongoose.model('Jeu', jeuSchema);

module.exports = JeuModel;