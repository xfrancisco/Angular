'use strict';
var baseUrl = 'http://localhost:8080/api/';

var comptesApp = angular.module('comptesApp', ['comptesModule']);

var comptesModule = angular.module('comptesModule', ['angularUtils.directives.dirPagination','angularCharts']);


comptesApp.run(function($rootScope) {
    $rootScope.callString = '';
    $rootScope.callString = '';
});

/*comptesModule.service('compteService', [function () {
    this.callString   = '';
    this.callResult   = '';
    
    this.initialize = function () {
        this.callString   = '';
        this.callResult   = '';
    }
    
    this.populate = function (result, message) {
        this.callString   = message;
        this.callResult   = result;
    }
}]);*/


comptesModule.filter('dateFilter', function ($filter) {
    return function (input) {
        var date = $filter('date')(new Date(input), 'dd/MM à HH:mm:ss');
        return date;
    }
});


comptesModule.controller('ChartController', ['$scope', '$http', function($scope, $http){
        
    $scope.chartType = 'bar';
    
    $scope.chartConfig = {
      title: 'Récapitulatif',
      tooltips: true,
      labels: false,
      mouseover: function() {},
      mouseout: function() {},
      click: function() {},
      legend: {
        display: true,
        //could be 'left, right'
        position: 'left'
      },
      innerRadius: 0, // applicable on pieCharts, can be a percentage like '50%'
      lineLegend: 'lineEnd', // can be also 'traditional'
      refreshDataOnly: true
    }
    
    $scope.computedData = [0,0,0];
    $scope.computeData = function(){
        $http.get(baseUrl + 'statistics').success(function(response){ 
            var tmp =   [           response.totalAmount,
                                    response.totalOfficialAmount,
                                    response.totalUnofficialAmount
                                    //response.dueOfficialAmount,
                                    //response.dueunofficialAmount,
                                    //response.paidOfficialAmount,
                                    //response.paidUnofficialAmount
                                    ];
            $scope.chartData.data[0].y = tmp;
        });
    };
    
    
    $scope.chartData = {
        "series": [
        "Totalité",
        "Montant total",
        "Intérêts"
        //"Montant dû",  
        //"Intérêts dûs",
        //"Montant payé",  
        //"Intérêts payés"
      ],
      "data": [
        {
          "x": "€",
          "y": $scope.computedData
        }
      ]
    }
    
    $scope.computeData();
}]);

comptesModule.controller('ComptesController', ['$scope', '$http', function($scope, $http){
        
    $scope.sortType     = 'dueDate'; // set the default sort type
    $scope.sortReverse  = false;  // set the default sort order
    $scope.searchPaymentPlan   = '';     // set the default search/filter term
    
    $scope.fetch = function(){
        $http.get(baseUrl + 'comptes').success(function(response){ $scope.details = response; });
    };

    $scope.rowClass = function(detail){
        var result = null;
        if (detail.officialPaid == false && new Date(detail.dueDate) < new Date()){
            return "danger";
        }

        if (detail.unofficialPaid == false && new Date(detail.dueDate) < new Date()){
            return "warning";
        }
        return "info";
    };
    
    $scope.accountUpdate = function(detail){
        var tmp = new Object();
        tmp.officialPaid = detail.officialPaid;
        tmp.unofficialPaid = detail.unofficialPaid;
        var tmp2 = angular.toJson(tmp, true);
        $http.put(baseUrl + 'comptes/' + detail._id, tmp2).success(function(response) {
            $scope.callString   = "Mise à jour de l'échéance du " + detail.dueDate;
            $scope.callResult = response.result;
            $scope.fetch();
        });
    };
    
    $scope.fetch();

}]);