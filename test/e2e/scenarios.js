'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function() {

  beforeEach(function() {
    browser().navigateTo('../../app/index.html');
  });


  it('should automatically redirect to / when location hash/fragment is empty', function() {
    expect(browser().location().url()).toBe("/");
  });


  describe('/', function() {

    beforeEach(function() {
      browser().navigateTo('#/');
    });


    it('should render / when user navigates to /', function() {
      expect(element('[ng-view] p:first').text()).
        toMatch(/partial for view 1/);
    });

  });


  describe('uri', function() {

    beforeEach(function() {
      browser().navigateTo('#/uri');
    });


    it('should render uri when user navigates to /uri', function() {
      expect(element('[ng-view] p:first').text()).
        toMatch(/partial for view 2/);
    });

  });
});
