//var chai = require('chai');
//var assert = chai.assert;
//var jsdom = require('mocha-jsdom')
//
//describe('Works', function() {
//	
//	it('should return params', function() {
//
////		var temp = t.hello();
//
//		var temp = "Hello";
//
//		assert.equal(temp, "Hello", 'Variables Should Match');
//	});
//});

var assert = require('assert');
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});