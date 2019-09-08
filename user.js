var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  name:  String,
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  game: { type: Boolean, default: false },
  argent: {type: Number, default: 0},
  /*inventory: [
		{
			"id": Number,
			"name": String,
			"type": String,
			"imgUrl": String,
			"description": String,
			"equiped": Boolean,
			"stats": [
				{
					"Force": {
						"from": Number
					}
				}
			],
		},
	  ]*/
});

var UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;