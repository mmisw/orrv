'use strict';

/* Filters */

angular.module('orrApp.filters', [])
  .filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }])

  .filter('mklinks', [function() {
    return function(text) {
      return vutil.mklinks4text(text);
    }
  }])
;
