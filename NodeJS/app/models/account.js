var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var AccountSchema   = new Schema({
    dueDate: {type:Date, unique: true},
    officialPaidDate: Date,
    unofficialPaidDate: Date,
    officialPaid:   {type : Boolean, default : false},
    unofficialPaid: {type : Boolean, default : false},
    officialAmount: Number,
    unofficialAmount : Number
});

module.exports = mongoose.model('Account', AccountSchema);