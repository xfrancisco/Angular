//  server.js
//  https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4
//  mongod.exe --dbpath ..\data

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

var Comptes     = require('./app/models/comptes');

var mongoose   = require('mongoose');
var uriUtil = require('mongodb-uri');
var options = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } };

//var args = process.argv.slice(2);
var isInit = false;
var isOnline = false;
process.argv.forEach(function (val, index, array) {
    if (val == 'init')
        isInit = true;
    if (val == 'online')
        isOnline = true;
});

var dbURI = '';
if (isOnline)
    dbUri = 'mongodb://webuser:@ds041154.mongolab.com:41154/xf81';
else
    dbURI = 'mongodb://localhost:27017/xf81';

var mongooseUri = uriUtil.formatMongoose(dbURI);



mongoose.connect(mongooseUri, function(err) {
    if (err) 
        throw err;
}); // connect to our database

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: "Bienvenue sur l'API comptes!" });   
});

// more routes for our API will happen here

// on routes that end in /comptes
// ----------------------------------------------------
var comptes = router.route('/comptes');

comptes.post(function(req, res) {
        var compte = new Comptes();      
        compte.officialAmount = parseFloat(req.body.officialAmount) * 100;
        compte.unofficialAmount = parseFloat(req.body.unofficialAmount) * 100;
        compte.dueDate = req.body.dueDate;
        
        compte.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Comptes created!' });
        });
        
    });

comptes.get(function(req, res) {
        Comptes.find({}).sort('dueDate').exec(function(err, comptes) {
            if (err)
                res.send(err);

            res.json(comptes);
        });
    });

    
comptes.delete(function(req, res) {
        Comptes.remove({}, function(err, comptes) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });


var comptesByDate = router.route('/comptes/:compteId');

comptesByDate.get(function(req, res) {
        Comptes.findById(req.params.compteId, function(err, compte) {
            if (err)
                res.send(err);
            res.json(compte);
        });
    });

comptesByDate.put(function(req, res) {
    Comptes.findById(req.params.compteId, function(err, compte) {
            if (err)
                res.send(err);
            compte.officialPaid = req.body.officialPaid;
            compte.unofficialPaid = req.body.unofficialPaid;
            
            if (compte.officialPaid) {
                compte.officialPaidDate = new Date();
            }
            else {
                 compte.officialPaidDate = null;
            }
            
            if (compte.unofficialPaid) {
                compte.unofficialPaidDate = new Date();
            }
            else {
                compte.unofficialPaidDate = null;
            }
            
            compte.save(function(err) {
                if (err){
                    res.json({ result : 'ERROR', message: err });
                }

                res.json({ result : 'SUCCESS', message: 'Compte mis à jour' });
            });

        });
    });

/*
// on routes that end in /bears/:bear_id
// ----------------------------------------------------
router.route('/bears/:bear_id')
    // get the bear with that id (accessed at GET api/bears/:bear_id)
    .get(function(req, res) {
        Bear.findById(req.params.bear_id, function(err, bear) {
            if (err)
                res.send(err);
            res.json(bear);
        });
    })
    
    // update the bear with this id (accessed at PUT api/bears/:bear_id)
    .put(function(req, res) {
        // use our bear model to find the bear we want
        Bear.findById(req.params.bear_id, function(err, bear) {
            if (err)
                res.send(err);
            bear.name = req.body.name;  // update the bears info
            // save the bear
            bear.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Bear updated!' });
            });

        });
    })

    // delete the bear with this id (accessed at DELETE api/bears/:bear_id)
    .delete(function(req, res) {
        Bear.remove({
            _id: req.params.bear_id
        }, function(err, bear) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });
*/
// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

if (isInit) {
    console.log('**************Initialisation BDD****************');
    Comptes.remove({}, function(err, comptes) {
        if (err) {
            console.log('Erreur lors de la suppression');
            exit;
        }
        var startDate = new Date("October 05, 2015 00:00:00");
        var maxDate = new Date("October 05, 2030 00:00:00");
        var cpt = 1;
        while (cpt < 182) {
            var compte = new Comptes();
            var tmp = new Date(startDate);
            compte.officialAmount = 500;
            compte.unofficialAmount = 185;
            compte.dueDate = tmp;
            cpt = cpt + 1;

            compte.save(function(err) {
                if (err){
                    console.log('Erreur sur insert');
                }
            });
            //console.log(startDate);
            startDate.setMonth(startDate.getMonth() + 1);
        }
    });
}


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);