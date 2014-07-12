'use strict';

angular.module('orrApp.main.controller', [])

    .controller('MainCtrl', ['$scope', '$routeParams', '$http', 'OrrModel',
        function ($scope, $routeParams, $http, OrrModel) {

        OrrModel.works.removeAll();

        $scope.so = $routeParams.so;
        $scope.mainList = OrrModel.getOntList();

        $scope.filterOptions = {
            filterText: $scope.so
        };

        var mklinksCellTemplate =
            '<div class="ngCellText">' +
                '<span ng-bind-html="row.entity[col.field] | mklinks"></span>'
                + '</div>';

        $scope.gridOptions = {
            data: 'mainList', columnDefs: [

                {field: 'authority', displayName: 'Org', width: "5%"
                },
                {field: 'uri', displayName: 'URI', width: "30%", cellTemplate: mklinksCellTemplate
                },
                {field: 'name', displayName: 'Name', width: "***", enableCellEdit: false, cellTemplate: mklinksCellTemplate
                },
                {field: 'author', displayName: 'Author', width: "**", enableCellEdit: false
                },
                {field: 'version', displayName: 'Version', width: "*", enableCellEdit: false
                }
            ]
            , multiSelect: false
            , rowHeight: 26        // 30 by default
            , enablePinning: false
            , showColumnMenu: true
            , showFilter: true
            , sortInfo: { fields: ['version'], directions: ['desc'] }
            , showGroupPanel: true
            , showFooter: true

            , enableHighlighting:    true
            , enableCellSelection:   false
            , enableRowSelection:    false
            , filterOptions:	     $scope.filterOptions
        };

        if ($scope.mainList.length > 0) {
            console.log("MainCtrl: already got data: " + $scope.mainList.length + " elems");
            return;
        }

        console.log("MainCtrl: retrieving data");
        var workId = OrrModel.works.add("retrieving list");
        $http.get('http://mmisw.org/ont/?listonts') // 'data/onts.json'
            .success(function (data, status, headers, config) {
                console.log("MainCtrl: got data: " + data.length + " elems");
                if (orrvConfig.onlyVisible) {
                    data = _.filter(data, function(e) {
                        return e.internal != "true" && e.version_status != "testing"});
                }
                console.log("MainCtrl: data: " + data.length + " elems");
                OrrModel.setOntList(data);
                $scope.mainList = data;
                OrrModel.works.remove(workId);
            });

    }])
;
