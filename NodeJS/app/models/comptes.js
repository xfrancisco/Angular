var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ComptesSchema   = new Schema({
    dueDate: {type:Date, unique: true},
    officialPaidDate: Date,
    unofficialPaidDate: Date,
    officialPaid:   {type : Boolean, default : false},
    unofficialPaid: {type : Boolean, default : false},
    officialAmount: Number,
    unofficialAmount : Number
});

module.exports = mongoose.model('Comptes', ComptesSchema);