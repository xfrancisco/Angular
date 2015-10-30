// Packages
var express    = require('express'); // Framework node
var app        = express();
var bodyParser = require('body-parser'); // Accès aux flux des request
var mongoose   = require('mongoose'); // Framework mongo
var uriUtil = require('mongodb-uri'); // Utile pour formatter les URL mongo
var jwt    = require('jsonwebtoken'); // Création, signature et contrôle des tokens
var morgan      = require('morgan'); // Log des request dans la console

// Fichier de configuration
var config = require('./config'); // get our config file

// Modèle de données
var Account = require('./app/models/account');
var User   = require('./app/models/user'); 

// Configuration du body parser (accès aux paramètres et à l'url)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Port du serveur
var port = process.env.PORT || 8080;

// Options
var options = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } };

// Parsing des paramètres du script
var isInit = false;
var isOnline = false;
process.argv.forEach(function (val, index, array) {
    if (val == 'init')
        isInit = true;
});

// Formattage de l'url de mongo
var mongooseUri = uriUtil.formatMongoose(config.database);

// Connection à la base de données
mongoose.connect(mongooseUri, function(err) {
    if (err) 
        throw err;
});

// Log des request dans la console
app.use(morgan('dev'));





// =============================================================================
// ROUTES FOR OUR API
// =============================================================================

// get an instance of the express Router
var router = express.Router();              

// middleware to use for all requests
router.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });    
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;    
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        return res.status(403).send({ 
            success: false, 
            message: 'No token provided.' 
        });
    }
});


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: "Bienvenue sur l'API Account!" });   
});


// =============================================================================
// USERS
// =============================================================================
router.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

router.post('/users', function(req, res) {
    var user = new User();      
    user.cuser = req.body.username;
    user.pass = req.body.password;
    user.indadmin = req.body.isAdmin;

    user.save(function(err) {
        if (err)
            res.send(err);
        res.json({ message: 'User created!' });
    });

});

// =============================================================================
// AUTHENTICATE
// =============================================================================

router.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   
    }
  });
});


// =============================================================================
// ACCOUNT
// =============================================================================

var account = router.route('/account');

account.post(function(req, res) {
        var account = new Account();      
        account.officialAmount = parseFloat(req.body.officialAmount) * 100;
        account.unofficialAmount = parseFloat(req.body.unofficialAmount) * 100;
        account.dueDate = req.body.dueDate;
        
        account.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Account created!' });
        });
        
    });

account.get(function(req, res) {
        Account.find({}).sort('dueDate').exec(function(err, account) {
            if (err)
                res.send(err);

            res.json(account);
        });
    });

    
account.delete(function(req, res) {
        account.remove({}, function(err, account) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });


var accountByDate = router.route('/account/:accountId');

accountByDate.get(function(req, res) {
        Account.findById(req.params.accountId, function(err, account) {
            if (err)
                res.send(err);
            res.json(account);
        });
    });

accountByDate.put(function(req, res) {
    Account.findById(req.params.accountId, function(err, account) {
            if (err)
                res.send(err);
            account.officialPaid = req.body.officialPaid;
            account.unofficialPaid = req.body.unofficialPaid;
            
            if (account.officialPaid) {
                account.officialPaidDate = new Date();
            }
            else {
                 account.officialPaidDate = null;
            }
            
            if (account.unofficialPaid) {
                account.unofficialPaidDate = new Date();
            }
            else {
                account.unofficialPaidDate = null;
            }
            
            account.save(function(err) {
                if (err){
                    res.json({ result : 'ERROR', message: err });
                }

                res.json({ result : 'SUCCESS', message: 'Account updated' });
            });

        });
    });


var allAccounts = router.route('/statistics');

allAccounts.get(function(req, res) {
    var result2 = new Object();
    
    Account.aggregate(
        { $group: {
                _id :   null,
                totalOfficialAmount: {$sum: "$officialAmount"},
                totalUnofficialAmount: { $sum: "$unofficialAmount" }
            }
        },
        function (err, result) {
            if (err) {
                console.log(err);
                return;
            }
            result2.totalOfficialAmount = result[0].totalOfficialAmount;
            result2.totalUnofficialAmount = result[0].totalUnofficialAmount;
            result2.totalAmount = result2.totalOfficialAmount + result2.totalUnofficialAmount;
            Account.aggregate(
                {
                    $match: {officialPaidDate:{$ne:null}}
                },
                { $group: {
                        _id :   null,
                        totalPaidOfficialAmount: {$sum: "$officialAmount"},
                    }
                },
                function (err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    result2.totalPaidOfficialAmount = 0;
                    if (result.length > 0){
                        result2.totalPaidOfficialAmount = result[0].totalPaidOfficialAmount;
                    }
                    
                    Account.aggregate(
                    {
                        $match: {unofficialPaidDate:{$ne:null}}
                    },
                    { $group: {
                            _id :   null,
                            totalPaidUnofficialAmount: {$sum: "$unofficialAmount"},
                        }
                    },
                    function (err, result) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        result2.totalPaidUnofficialAmount = 0;
                        if (result.length > 0){
                            result2.totalPaidUnofficialAmount = result[0].totalPaidUnofficialAmount;
                        }
                        res.json(result2);
                    });
                });
        });
    
    
    return;
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);


// Initialisation de la base de données
if (isInit) {
    console.log('**************Initialize Database****************');
    Account.remove({}, function(err, account) {
        if (err) {
            console.log('Error during initialization');
            exit;
        }
        var startDate = new Date("October 05, 2015 00:00:00");
        var maxDate = new Date("October 05, 2030 00:00:00");
        var cpt = 1;
        while (cpt < 182) {
            var account = new Account();
            var tmp = new Date(startDate);
            account.officialAmount = 500;
            account.unofficialAmount = 185;
            account.dueDate = tmp;
            cpt = cpt + 1;

            account.save(function(err) {
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