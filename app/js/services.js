'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('orrApp.services', []).
  value('version', '0.0.2');
