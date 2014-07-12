'use strict';

angular.module('orrApp.data', [])

    .factory('dataService', ['$http',
        function($http) {

            function logQuery(query) {
                //console.log("making query: " + query);
            }

            function getSubjectData(uri, fns) {
                var query = 'select distinct ?predicate ?value\n' +
                    'where { <' + uri + '> ?predicate ?value. }\n' +
                    'order by ?predicate';

                logQuery(query);

                $http.get(orrvConfig.sparqlEndpoint, {params: {query: query}})
                    .success(function (data, status, headers, config) {

                        //console.log("getSubjectData: got response. status= " + status);
                        //console.log("data = " + JSON.stringify(data));

                        //var names = data.names;
                        var rows = data.values;

                        var predicates = {};
                        _.each(rows, function(e) {
                            var predicate = e[0];
                            var value     = e[1];

                            if (!predicates.hasOwnProperty(predicate)) {
                                predicates[predicate] = [];
                            }
                            predicates[predicate].push(value);
                        });

                        fns.gotSubjectData(predicates);
                    }
                );
            }

            function getObjectData(uri, fns) {
                var query = 'select distinct ?subject ?predicate\n' +
                    //'from <' +uri+ '>\n' +
                    'where { ?subject ?predicate <' + uri + '>. }\n' +
                    'order by ?subject';

                logQuery(query);

                $http.get(orrvConfig.sparqlEndpoint, {params: {query: query}})
                    .success(function (data, status, headers, config) {

                        //console.log("getObjectData: got response. status= " + status);
                        //console.log("data = " + JSON.stringify(data));

                        //var names = data.names;
                        var rows = data.values;

                        var predicates = {};
                        _.each(rows, function(e) {
                            var subject   = e[0];
                            var predicate = e[1];

                            if (!predicates.hasOwnProperty(predicate)) {
                                predicates[predicate] = [];
                            }
                            predicates[predicate].push(subject);
                        });

                        fns.gotObjectData(predicates);
                    }
                );
            }

            function getSubjectsInGraph(uri, fns) {
                var query = 'select distinct ?subject\n' +
                    'from <' + uri + '>\n' +
                    'where { ?subject ?predicate ?value. }\n' +
                    'order by ?subject';

                logQuery(query);

                $http.get(orrvConfig.sparqlEndpoint, {params: {query: query}})
                    .success(function (data, status, headers, config) {
                        //console.log("getSubjectsInGraph: data=", data);
                        //var names = data.names;
                        var rows = data.values;
                        var subjects = _.map(rows, function(e) { return e[0]; });
                        fns.gotSubjectsInGraph(subjects);
                    }
                );
            }

            function getTriplesInGraph(uri, fns) {
                var query = 'select distinct ?subject ?predicate ?value\n' +
                    'from <' + uri + '>\n' +
                    'where { ?subject ?predicate ?value.\n' +
                    '        filter ( ?subject != <' + uri + '> ) .' +  // exclude the uri itself as subject
                    '}\n' +
                    'order by ?subject ?predicate';

                logQuery(query);

                $http.get(orrvConfig.sparqlEndpoint, {params: {query: query}})
                    .success(function (data, status, headers, config) {
                        //console.log("getGraphData: data=", data);
                        //var names = data.names;
                        var triples = data.values;
                        fns.gotTriplesInGraph(triples);
                    }
                );
            }

            return {
                getSubjectData:     getSubjectData,
                getObjectData:      getObjectData,
                getSubjectsInGraph: getSubjectsInGraph,
                getTriplesInGraph:  getTriplesInGraph
            };
        }]);
