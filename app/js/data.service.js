'use strict';

angular.module('orrApp.data', [])

    .factory('dataService', ['$http',
        function($http) {

            var sparqlEndpoint = orrvConfig.sparqlEndpoint;

            function logQuery(query) {
                //console.log("making query: " + query);
            }

            var getSubjectData = function(uri, opts, fns) {

                var query = 'select distinct ?predicate ?value\n' +
                    //'from <' +uri+ '>\n' +
                    'where { <' + uri + '> ?predicate ?value. }\n' +
                    'order by ?predicate';

                logQuery(query);

                $http.get(sparqlEndpoint, {params: {query: query}})
                    .success(function (data, status, headers, config) {

                        //console.log("getSubjectData: got response. status= " + status);
                        //console.log("data = " + JSON.stringify(data));

                        //var names = data.names;
                        var rows = data.values;

                        var predicates = {};

                        var result = _.map(rows, function(e) {
                            var predicate = e[0];
                            var value     = e[1];

                            value = opts.htmlify ? vutil.htmlifyObject(value) : _.escape(value);

                            var htmlPred;
                            if (!predicates.hasOwnProperty(predicate)) {
                                htmlPred = vutil.htmlifyUri(predicate);
                                predicates[predicate] = {html: htmlPred, values: []};
                            }
                            else {
                                htmlPred = predicates[predicate].html;
                            }

                            if (opts.aggregatePredicates) {
                                predicates[predicate].values.push(value);
                            }
                            if (opts.htmlify) {
                                return {predicate: htmlPred, value: value};
                            }
                            else {
                                return {predicate: _.escape(predicate), value: value};
                            }
                        });
                        //console.log("result = " + JSON.stringify(result));

                        if (opts.aggregatePredicates) {
                            fns.gotSubjectData(_.map(predicates, function(d, predicate) {
                                return {predicate: opts.htmlify ? d.html : predicate, values: d.values};
                            }));
                        }
                        else {
                            fns.gotSubjectData(result);
                        }
                    })
                ;
            };

            var getObjectData = function(uri, opts, fns) {

                var query = 'select distinct ?subject ?predicate\n' +
                    //'from <' +uri+ '>\n' +
                    'where { ?subject ?predicate <' + uri + '>. }\n' +
                    'order by ?subject';

                logQuery(query);

                $http.get(sparqlEndpoint, {params: {query: query}})
                    .success(function (data, status, headers, config) {

                        //console.log("getObjectData: got response. status= " + status);
                        //console.log("data = " + JSON.stringify(data));

                        //var names = data.names;
                        var rows = data.values;

                        var subjects = {};

                        var result = _.map(rows, function(e) {
                            var subject   = e[0];
                            var predicate = e[1];

                            if (opts.htmlify) {
                                predicate = vutil.htmlifyUri(predicate);
                            }

                            var htmlPred;
                            if (!subjects.hasOwnProperty(subject)) {
                                htmlPred = vutil.htmlifyUri(subject);
                                subjects[subject] = [{html: htmlPred, predicates: []}];
                            }
                            else {
                                htmlPred = subjects[subject].html;
                            }

                            if (opts.aggregateSubjects) {
                                subjects[subject].predicates.push(predicate);
                            }
                            if (opts.htmlify) {
                                return {subject: htmlPred, predicate: predicate};
                            }
                            return {subject: subject, predicate: predicate};
                        });
                        //console.log("result = " + JSON.stringify(result));

                        if (opts.aggregateSubjects) {
                            fns.gotObjectData(subjects);
                        }
                        else {
                            fns.gotObjectData(result);
                        }
                    })
                ;
            };

            var getSubjectsInGraph = function(uri, opts, fns) {

                var query = 'select distinct ?subject\n' +
                    'from <' + uri + '>\n' +
                    'where { ?subject ?predicate ?value. }\n' +
                    'order by ?subject';


                logQuery(query);

                $http.get(sparqlEndpoint, {params: {query: query}})
                    .success(function (data, status, headers, config) {

                        fns.gotSubjectsInGraph(data);

                    });

            };

            return {
                getSubjectData:     getSubjectData,
                getObjectData:      getObjectData,
                getSubjectsInGraph: getSubjectsInGraph
            };
        }]);
