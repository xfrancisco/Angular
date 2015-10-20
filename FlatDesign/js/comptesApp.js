'use strict';

var comptesApp = angular.module('comptesApp', ['comptesModule', 'routageModule']);

var comptesModule = angular.module('comptesModule', []);
var routageModule = angular.module('routageModule', ['ngRoute']);

routageModule.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/index', {
        templateUrl: "index.html",
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


comptesModule.filter('dateFilter', function ($filter) {
    return function (input) {
        var date = $filter('date')(new Date(input), 'dd/MM à HH:mm:ss');
        return date;
    }
});

angular.module('comptesApp', []).controller('ComptesController', function($scope, $http){
    fetch();
    function fetch(){
      $http.get("http://localhost:8080/api/comptes").success(function(response){ $scope.details = response; });
    }

});