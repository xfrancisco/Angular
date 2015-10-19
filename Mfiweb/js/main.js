// js/main.js
'use strict';


/**
 * Déclaration de l'application mainApp
 */
var mainApp = angular.module('mainApp', ['mainModule', 'routageModule']);

/**
 * Déclaration du module mainModule
 */
var mainModule = angular.module('mainModule', []);

var routageModule = angular.module('routageModule', ['ngRoute']);



mainModule.service('mainService', [function () {
    this.panier = [];

    this.addFruit = function (fruit) {
        this.panier.push(fruit.Nom);
    }
    
    this.removeFruit = function (fruit) {
        this.panier.pop(fruit.Nom);
    }
}]);


mainModule.controller('restController', ['$scope', '$http', function ($scope, $http) {
        
        $scope.getVersion = function (user) {
            $http.get('http://localhost:8080/MfiWS/rest/codeTable/version?userId=' + user).success(function(data) {
                $scope.result = data;
            });
        };
    }
]);

/**
 * Contrôleur mainController du module mainModule  
 */
mainModule.controller('mainController', ['$scope', 'mainService', function ($scope, mainService) {
        $scope.fruit = "pomme";
        
        $scope.fruit2 = {
            Nom: "pomme",
            Couleur: "rouge",
            Peremption: new Date()
        };
        
        $scope.fruits = 
        [{
            Nom: "pomme",
            Couleur: "rouge",
            Peremption: new Date()
        },
        {
            Nom: "poire",
            Couleur: "verte",
            Peremption: new Date()
        },
        {
            Nom: "prune",
            Couleur: "violette",
            Peremption: new Date()
        }];
    
        $scope.addFruit = function (fruit) {
            mainService.addFruit(fruit);
        };
    
        $scope.removeFruit = function (fruit) {
            mainService.removeFruit(fruit);
        };
    }
]);


mainModule.controller('secondController', ['$scope', 'mainService', function ($scope, mainService) {
        $scope.panier = mainService.panier;
    }
]);

mainModule.filter('dateFilter', function ($filter) {
    return function (input) {
        var date = $filter('date')(new Date(input), 'dd/MM à HH:mm:ss');
        return date;
    }
});


mainModule.directive('mainDirective', function () {
    return {
        template: 'la {{fruit.Nom}} de couleur {{fruit.Couleur}} périme le {{fruit.Peremption | dateFilter}}'
    }
});

mainModule.directive('mainDirective2', function () {
    return {
        template: '<li ng-repeat="fruit in fruits"><main-directive></main-directive> <button ng-click="addFruit(fruit)">Ajouter le fruit au panier</button> <button ng-click="removeFruit(fruit)">Supprimer le fruit au panier</button></li>'
    }
});

mainModule.directive('restDirective', function () {
    return {
        template: '<li ng-repeat="fruit in fruits"><main-directive></main-directive> <button ng-click="addFruit(fruit)">Ajouter le fruit au panier</button> <button ng-click="removeFruit(fruit)">Supprimer le fruit au panier</button></li>'
    }
});


routageModule.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/fruit', {
        templateUrl: "fruits.html",
        controller: "mainController"
    })
    .when('/panier', {
        templateUrl: "panier.html",
        controller: "secondController"
    })
    .otherwise({
        redirectTo: '/fruit'
    })
}]);









