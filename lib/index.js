'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Rolex = require('rolex');
Rolex.noConflict();

module.exports = {
  uniform: {
    process: createUniform
  },
  poisson: {
    process: createPoisson
  }
};

function createUniform(tickInterval, duration) {
  var up = new UniformProcess(tickInterval, duration);
  return up;
}

function createPoisson(mean, duration) {
  return new PoissonProcess(mean, duration);
}

function UniformProcess(tickInterval, duration) {
  this._tickInterval = tickInterval;
  this._interval = null;
  this._duration = duration || null; // ms
  return this;
}

util.inherits(UniformProcess, EventEmitter);

UniformProcess.prototype.start = function() {
  var self = this;
  self._interval = Rolex.setInterval(function() {
    self.emit('arrival');
  }, self._tickInterval);
  if (self._duration) {
    setTimeout(function() {
      self.stop();
    }, self._duration + self._tickInterval / 2);
  }
  return self;
};

UniformProcess.prototype.stop = function() {
  Rolex.clearInterval(this._interval);
  this.emit('finished');
  return this;
};

function PoissonProcess(mean, duration) {
  this._mean = mean;
  this._timeout = null;
  this._duration = duration * 1e6 || null; // ns
  this._elapsed = null;
  return this;
}

util.inherits(PoissonProcess, EventEmitter);

PoissonProcess.prototype.start = function() {
  var dt = sample(this._mean);
  var started = process.hrtime();
  var self = this;
  self._timeout = Rolex.setTimeout(function() {
    var ended = process.hrtime(started);
    self._elapsed += (ended[0] * 1e9) + ended[1];
    if (self._duration && (self._elapsed >= self._duration)) {
      // done, nothing to clear
      self.emit('finished');
    } else {
      self.start();
      self.emit('arrival');
    }
  }, dt);
};

PoissonProcess.prototype.stop = function() {
  Rolex.clearTimeout(this._timeout);
  this.emit('finished');
};

function sample(l) {
  // http://wwwhome.math.utwente.nl/~scheinhardtwrw/ISP2013/sheets9.pdf
  return -Math.log(Math.random()) * l;
}
