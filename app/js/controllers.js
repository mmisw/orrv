'use strict';

/* Controllers */

angular.module('orrApp.controllers', [])

    .controller('MainCtrl', ['$scope', '$http', 'OrrModel',
        function ($scope, $http, OrrModel) {

        OrrModel.works.removeAll();

        $scope.mainList = OrrModel.getOntList();

        var mklinksCellTemplate =
            '<div class="ngCellText">' +
                '<span ng-bind-html="row.entity[col.field] | mklinks"></span>'
                + '</div>';

        $scope.gridOptions = {
            data: 'mainList', columnDefs: [

                {field: 'uri', displayName: 'URI', width: "30%", cellTemplate: mklinksCellTemplate
                },
                {field: 'name', displayName: 'Name', width: "***", enableCellEdit: false, cellTemplate: mklinksCellTemplate
                },
                {field: 'author', displayName: 'Author', width: "**", enableCellEdit: false},
                {field: 'version', displayName: 'Version', width: "*", enableCellEdit: false}
            ], multiSelect: false, rowHeight: 26        // 30 by default
            , enablePinning: false, showColumnMenu: true, showFilter: true, sortInfo: { fields: ['version'], directions: ['desc'] }, showGroupPanel: true, showFooter: true

            //,enableCellEditOnFocus: true
            , enableCellSelection: false
            //,enableCellEdit:        true
            , enableRowSelection: false
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
                OrrModel.setOntList(data);
                $scope.mainList = data;
                OrrModel.works.remove(workId);
            });

    }])

    .controller('UriCtrl', ['$scope', '$routeParams', '$http', 'OrrModel',
        function ($scope, $routeParams, $http, OrrModel) {

            OrrModel.works.removeAll();
            $scope.works = OrrModel.works;

            // ng-grid does not support fitting row height to content: https://github.com/angular-ui/ng-grid/issues/157

            $scope.uri = $routeParams.uri;

            getSubjectData($scope, $http);
            getSubjectsInGraph($scope, $http);
            //getGraphData($scope, $http);
        }])
    ;

function getSubjectData($scope, $http) {
    $scope.subjectData = {size: 0, names: [''], rows: []};

    var uri = $scope.uri;

    var query = 'select distinct ?predicate ?value\n' +
        //'from <' +uri+ '>\n' +
        'where { <' + uri + '> ?predicate ?value. }\n' +
        'order by ?predicate';

    //console.log("making query: " + query);
    var workId = $scope.works.add("making subject query");

    $http.get('http://mmisw.org/sparql', {params: {query: query}})
        .success(function (data, status, headers, config) {

            //console.log("getSubjectData: got response. status= " + status);
            //console.log("data = " + JSON.stringify(data));

            $scope.works.update(workId, "preparing subject data display");

            var names = data.names;
            var rows = data.values;

            $scope.subjectData.names = names;
            $scope.subjectData.size  = rows.length;

            if (rows.length === 0) {
                $scope.works.remove(workId);
                return;
            }
            var predicates = {};

            _.each(rows, function(row) {
                var predicate = row[0];
                var value     = row[1].replace(/^"(.*)"$/, '$1');

                if (!predicates.hasOwnProperty(predicate)) {
                    predicates[predicate] = [];
                }
                predicates[predicate].push(value);
            });


            var res_rows = [];
            for (var predicate in predicates) {
                if (!predicates.hasOwnProperty(predicate)) {
                    continue;
                }

                var values = predicates[predicate];

                _.each(values, function(value, jj) {
                    value = values[jj];
                    if (/^<([^>]*)>$/.test(value)) {
                        // it is an uri.
                        value = vutil.mklinks4uri(value, true);
                    }
                    else {
                        // string with language tag?
                        var m = value.match(/^("[^"]+")(@[A-Za-z\-]+)$/);
                        if (m) {
                            // http://stackoverflow.com/questions/7885096/how-do-i-decode-a-string-with-escaped-unicode
                            value = '"' + decodeURIComponent(JSON.parse(m[1])) + '"' + m[2];
                        }
                        else {
                            value = vutil.mklinks4text(value);
                        }
                    }
                    values[jj] = value;
                });

                predicate = vutil.mklinks4uri(predicate, true);
                predicate = '<span stype="white-space:nowrap;">' +predicate+ '</span>';
                res_rows.push([predicate, values]);
            }

            $scope.works.update(workId, "rendering subject data" + " (" +res_rows.length+ ")");
            $scope.subjectData.rows = [];
            var start = new Date().getTime();
            vutil.updateModelArray($scope.subjectData.rows, res_rows,
                function(done) {
                    if (done) {
                        $scope.works.remove(workId);
                        $scope.$parent.$digest();
                        console.log("getSubjectData: rendered." + " (" +((new Date().getTime()) - start)+ ")");
                        return true;
                    }
                    else {
                        $scope.$digest();
                        var cont = $scope.works.has(workId);
                        if (!cont) {
                            console.log("getSubjectData: rendering canceled.");
                        }
                        return cont;
                    }
                }
            );
        })
    ;
}

function getSubjectsInGraph($scope, $http) {
    $scope.subjectsInGraph = {size: 0, rows: []};

    var uri = $scope.uri;

    var query = 'select distinct ?subject\n' +
        'from <' + uri + '>\n' +
        'where { ?subject ?predicate ?value. }\n' +
        'order by ?subject';

    //console.log("making query: " + query);
    var workId = $scope.works.add("querying for all subjects in graph");

    var cols = 2;   // number of subjects per row

    $http.get('http://mmisw.org/sparql', {params: {query: query}})
        .success(function (data, status, headers, config) {

            $scope.works.update(workId, "preparing display");

            var rows = data.values;

            $scope.subjectsInGraph.size = rows.length;

            if (rows.length == 0) {
                $scope.works.remove(workId);
                return;
            }

            var res_rows = [];
            var res_row = [];
            _.each(rows, function(row) {
                var subject = vutil.mklinks4uri(row[0], true);
                res_row.push(subject);

                if (res_row.length == cols) {
                    res_rows.push(res_row);
                    res_row = [];
                }
            });
            if (res_row.length > 0) {
                res_rows.push(res_row);
            }

            //console.log("getSubjectsInGraph: rows to update: " + res_rows.length);
            $scope.works.update(workId, "rendering graph subjects" + " (" +rows.length+ ")");

            var start = new Date().getTime();
            $scope.subjectsInGraph.rows = [];
            vutil.updateModelArray($scope.subjectsInGraph.rows, res_rows,
                function(done) {
                    if (done) {
                        $scope.works.remove(workId);
                        $scope.$parent.$digest();
                        console.log("getSubjectsInGraph: rendered." + " (" +((new Date().getTime()) - start)+ ")");
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
        })
    ;
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

