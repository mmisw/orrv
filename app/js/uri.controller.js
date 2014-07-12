'use strict';

angular.module('orrApp.uri.controller', ['trNgGrid'])

    .controller('UriCtrl', ['$scope', '$routeParams', '$http', 'dataService', 'OrrModel',
        function ($scope, $routeParams, $http, dataService, OrrModel) {

            OrrModel.works.removeAll();
            $scope.works = OrrModel.works;

            $scope.uri = $routeParams.uri;

            $scope.subjectList = [];

            $scope.instances = [];
            $scope.objectList = [];

            $scope.subjectsInGraph = [];
            $scope.triplesInGraph = [];

            getSubjectData($scope, dataService);
            getObjectData($scope, dataService);
            //getSubjectsInGraph($scope, dataService);
            getTriplesInGraph($scope, dataService);
        }])
    ;

function getSubjectData($scope, dataService) {
    var uri = $scope.uri;

    var workId = $scope.works.add("making subject query");
    var htmlify = true;
    var aggregatePredicates = true;

    dataService.getSubjectData(uri, {
        gotSubjectData: function(predicates) {
            //console.log("gotSubjectData: ", predicates);
            var newPredicates = {}; // with htmlified or escaped uri's and values
            _.each(predicates, function(values, predicate) {
                var procPred = htmlify ? vutil.htmlifyUri(predicate) : _.escape(predicate);
                newPredicates[procPred] = _.map(values, function(value) {
                    return htmlify ? vutil.htmlifyObject(value) : _.escape(value);
                });
            });

            var result = [];
            if (aggregatePredicates) {
                result = _.map(newPredicates, function(values, predicate) {
                    if (values.length == 1) {
                        return {predicate: predicate, value: values[0]};
                    }
                    else {
                        var lis = _.map(values, function(value) { return '<li>' + value + '</li>'; });
                        return {predicate: predicate, value: '<ul>' + lis.join('') + '</ul>'};
                    }
                });
            }
            else {
                _.each(newPredicates, function(values, predicate) {
                    _.each(values, function(value) {
                        result.push({predicate: predicate, value: value});
                    });
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
    var htmlify = true;
    var aggregatePredicates = false; // false because a class with many instances will make a very big single row.

    var rdfTypeUri = "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>";

    dataService.getObjectData(uri, {
        gotObjectData: function(predicates) {
            //console.log("gotObjectData: ", predicates);

            if (_.has(predicates, rdfTypeUri)) {
                // extract the instances
                $scope.instances = _.map(predicates[rdfTypeUri], function(subject) {
                    var htmlSubject = htmlify ? vutil.htmlifyUri(subject) : _.escape(subject);
                    return {subject: htmlSubject};
                });
                predicates = _.omit(predicates, rdfTypeUri);
            }

            var newPredicates = {}; // with htmlified or escaped uri's and subjects

            _.each(predicates, function(subjects, predicate) {
                var procPred = htmlify ? vutil.htmlifyUri(predicate) : _.escape(predicate);
                newPredicates[procPred] = _.map(subjects, function(subject) {
                    return htmlify ? vutil.htmlifyUri(subject) : _.escape(subject);
                });
            });

            var result = [];
            if (aggregatePredicates) {
                result = _.map(newPredicates, function(subjects, predicate) {
                    if (subjects.length == 1) {
                        return {predicate: predicate, subject: subjects[0]};
                    }
                    else {
                        var lis = _.map(subjects, function(subject) { return '<li>' + subject + '</li>'; });
                        return {predicate: predicate, subject: '<ul>' + lis.join('') + '</ul>'};
                    }
                });
            }
            else {
                _.each(newPredicates, function(subjects, predicate) {
                    _.each(subjects, function(subject) {
                        result.push({predicate: predicate, subject: subject});
                    });
                });
            }
            $scope.objectList = result;
            $scope.works.remove(workId);
        }
    });
}

function getSubjectsInGraph($scope, dataService) {
    var uri = $scope.uri;

    //console.log("making query: " + query);
    var workId = $scope.works.add("querying for all subjects in graph");
    var htmlify = true;

    dataService.getSubjectsInGraph(uri, {
        gotSubjectsInGraph: function(subjects) {
            $scope.works.update(workId, "preparing display");
            //console.log("getSubjectsInGraph: subjects=", subjects);

            var newSubjects = _.map(subjects, function(subject) {
                return htmlify ? vutil.htmlifyUri(subject) : _.escape(subject);
            });
            //console.log("getSubjectsInGraph: newSubjects=", newSubjects);

            $scope.works.update(workId, "rendering graph subjects" + " (" +subjects.length+ ")");

            $scope.subjectsInGraph = [];
            vutil.updateModelArray($scope.subjectsInGraph, newSubjects,
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
        }
    });
}

function getTriplesInGraph($scope, dataService) {
    var uri = $scope.uri;

    //console.log("making query: " + query);
    var workId = $scope.works.add("querying for all triples in graph");
    var htmlify = true;

    dataService.getTriplesInGraph(uri, {
        gotTriplesInGraph: function(triples) {
            //console.log("gotGraphData: triples= ", triples);

            $scope.works.update(workId, "preparing display");

            var newTriples = _.map(triples, function(triple) {
                var subject   = triple[0];
                var predicate = triple[1];
                var object    = triple[2];

                subject   = htmlify ? vutil.htmlifyUri(subject)   : _.escape(subject);
                predicate = htmlify ? vutil.htmlifyUri(predicate) : _.escape(predicate);
                object    = htmlify ? vutil.htmlifyObject(object) : _.escape(object);

                return {subject: subject, predicate: predicate, object: object};
            });
            //console.log("gotGraphData: newTriples=", newTriples);

            $scope.works.update(workId, "rendering graph triples" + " (" +newTriples.length+ ")");

            $scope.triplesInGraph = [];
            vutil.updateModelArray($scope.triplesInGraph, newTriples,
                function(done) {
                    if (done) {
                        $scope.works.remove(workId);
                        $scope.$parent.$digest();
                        console.log("getTriplesInGraph: rendered.");
                        return true;
                    }
                    else {
                        $scope.$digest();
                        var cont = $scope.works.has(workId);
                        if (!cont) {
                            console.log("getTriplesInGraph: rendering canceled.");
                        }
                        return cont;
                    }
                }
            );
        }
    });
}

