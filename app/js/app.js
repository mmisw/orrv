'use strict';


// Declare app level module which depends on filters, and services
angular.module('orrApp', [
        'ngGrid',
        'ngRoute',
        'orrApp.filters',
        'orrApp.services',
        'orrApp.directives',
        'orrApp.controllers',
        'ngSanitize'
    ])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'})

            .when('/so/:so', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'})

            .when('/uri/:uri*', {
                templateUrl: 'views/uri.html',
                controller: 'UriCtrl'
            })

            .otherwise({redirectTo: '/'});
    }])

    .factory('OrrModel', ['$rootScope', function($rootScope) {
        var nextWorkId = 0;
        var worksById = {};

        var works = {
            add: function(w) {
                var id = ++nextWorkId;
                worksById[id] = w;
                return id;
            },
            has:  function(id) {
                return worksById[id] !== undefined;
            },
            remove:  function(id) {
                var w = worksById[id];
                delete worksById[id];
                return w;
            },
            update:  function(id, w) {
                worksById[id] = w;
            },
            removeAll: function() {
                worksById = {};
            },
            any:  function() {
                if (_.size(worksById) > 0) {
                    for (var id in worksById) {
                        if (worksById.hasOwnProperty(id)) {
                            return worksById[id];
                        }
                    }
                }
                return undefined;
            }
        };

        $rootScope.works = works;

        var ontList = [];

        return {
            getOntList:  function() { return ontList; },
            setOntList:  function(list) { ontList = list; },
            works: works
        };
    }])
;
