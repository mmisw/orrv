'use strict';

angular.module('orrApp.uri.controller', ['trNgGrid'])

    .controller('UriCtrl', ['$scope', '$routeParams', '$http', 'dataService', 'OrrModel',
        function ($scope, $routeParams, $http, dataService, OrrModel) {

            OrrModel.works.removeAll();
            $scope.works = OrrModel.works;

            $scope.uri = $routeParams.uri;

            $scope.subjectList = [];
            $scope.objectList = [];

            getSubjectData($scope, dataService);
            getObjectData($scope, dataService);
            getSubjectsInGraph($scope, dataService);
            //getGraphData($scope, $http);
        }])
    ;

function getSubjectData($scope, dataService) {
    var uri = $scope.uri;

    var workId = $scope.works.add("making subject query");
    var aggregatePredicates = true;
    dataService.getSubjectData(uri, {htmlify: true, aggregatePredicates: aggregatePredicates},
        {
        gotSubjectData: function(result) {
            //console.log("gotSubjectData: ", result);
            //$scope.works.update(workId, "rendering subject data" + " (" +result.length+ ")");
            if (aggregatePredicates) {
                result = _.map(result, function(e) {
                    var predicate = e.predicate;
                    var values    = e.values;
                    if (values.length == 1) {
                        return {predicate: predicate, value: values[0]};
                    }
                    else {
                        var lis = _.map(values, function(v) {
                           return '<li>' + v + '</li>';
                        });
                        return {predicate: predicate, value: '<ul>' + lis.join('') + '</ul>'};
                    }
                });
            }
            $scope.subjectList = result;
            $scope.works.remove(workId);
        }
    });
}

function getObjectData($scope, dataService) {
    var uri = $scope.uri;

    var workId = $scope.works.add("making object query");
    dataService.getObjectData(uri,
        {htmlify: true}, {
        gotObjectData: function(result) {
            //console.log("gotObjectData: ", result);
            $scope.works.update(workId, "rendering object data" + " (" +result.length+ ")");
            $scope.objectList = result;
            $scope.works.remove(workId);
        }
    });
}

function getSubjectsInGraph($scope, dataService) {
    $scope.subjectsInGraph = {size: 0, rows: []};

    var uri = $scope.uri;

    //console.log("making query: " + query);
    var workId = $scope.works.add("querying for all subjects in graph");

    dataService.getSubjectsInGraph(uri, {}, {
        gotSubjectsInGraph: function(data) {

            $scope.works.update(workId, "preparing display");

            var rows = data.values;
            //console.log("getSubjectsInGraph: rows: ", rows);

            $scope.subjectsInGraph.size = rows.length;

            if (rows.length == 0) {
                $scope.works.remove(workId);
                return;
            }

            var res_rows = [];
            _.each(rows, function(row) {
                var subject = vutil.mklinks4uri(row[0], true);
                res_rows.push(subject);
            });

            $scope.works.update(workId, "rendering graph subjects" + " (" +rows.length+ ")");

            $scope.subjectsInGraph.rows = [];
            vutil.updateModelArray($scope.subjectsInGraph.rows, res_rows,
                function(done) {
                    if (done) {
                        $scope.works.remove(workId);
                        $scope.$parent.$digest();
                        console.log("getSubjectsInGraph: rendered.");
                        return true;
                    }
                    else {
                        $scope.$digest();
                        var cont = $scope.works.has(workId);
                        if (!cont) {
                            console.log("getSubjectsInGraph: rendering canceled.");
                        }
                        return cont;
                    }
                }
            );
        }});
}

function getGraphData($scope, $http) {
    $scope.graphData = {names: [''], rows: []};

    var uri = $scope.uri;

    var query = 'select distinct ?subject ?predicate ?value\n' +
        'from <' + uri + '>\n' +
        'where { ?subject ?predicate ?value.\n' +
        '        filter ( ?subject != <' + uri + '> ) .' +  // exclude the uri itself as subject
        '}';

    //console.log("making query: " + query);
    var workId = $scope.works.add("querying for all triples in graph");

    $http.get('http://mmisw.org/sparql', {params: {query: query}})
        .success(function (data, status, headers, config) {

            //console.log("getGraphData: got response. status= " + status);
            //console.log("data = " + JSON.stringify(data));

            $scope.works.update(workId, "preparing display");

            var names = data.names;
            var rows = data.values;

            $scope.graphData.names = names;

            if (rows.length == 0) {
                $scope.works.remove(workId);
                return;
            }

            var subjects = {};

            _.each(rows, function(row) {
                var subject = row[0].replace(/^<(.*)>$/, '$1');
                var predicate = row[1].replace(/^<(.*)>$/, '$1');
                var value = row[2].replace(/^"(.*)"$/, '$1');

                if (!subjects.hasOwnProperty(subject)) {
                    // new subject
                    subjects[subject] = {};
                }

                if (!subjects[subject].hasOwnProperty(predicate)) {
                    // new predicate
                    subjects[subject][predicate] = [];
                }

                subjects[subject][predicate].push(value);
            });

            //console.log("getGraphData: subjects assigned: " + _.size(subjects));

            var res_rows = [];
            for (var subject in subjects) {
                if (!subjects.hasOwnProperty(subject)) {
                    continue;
                }

                for (var predicate in subjects[subject]) {
                    if (!subjects[subject].hasOwnProperty(predicate)) {
                        continue;
                    }

                    var values = subjects[subject][predicate];

                    _.each(values, function(value, jj) {
                        value = value.replace(/^<(.*)>$/, '$1');
                        value = vutil.mklinks4text(value);
                        values[jj] = value;
                    });

                    var res_value;
                    if (values.length == 1) {
                        res_value = values[0];
                    }
                    else {
                        res_value = '<ul>';
                        _.each(values, function(value) {
                            res_value += '\n<li>' + value + '</li>';
                        });

                        res_value += '\n</ul>';
                    }
                    res_rows.push([vutil.mklinks4uri(subject),
                        vutil.mklinks4uri(predicate),
                        res_value]);
                }
            }
            //console.log("getGraphData: rows to update: " + res_rows.length);
            $scope.works.update(workId, "rendering triples in graph" + " (" +res_rows.length+ ")");

            var start = new Date().getTime();
            $scope.graphData.rows = [];
            vutil.updateModelArray($scope.graphData.rows, res_rows,
                function(done) {
                    if (done) {
                        $scope.works.remove(workId);
                        $scope.$parent.$digest();
                        console.log("getGraphData: rendered." + " (" +((new Date().getTime()) - start)+ ")");
                        return true;
                    }
                    else {
                        $scope.$digest();
                        var cont = $scope.works.has(workId);
                        if (!cont) {
                            console.log("getGraphData: rendering canceled.");
                        }
                        return cont;
                    }
                }
            );
        })
    ;
}

