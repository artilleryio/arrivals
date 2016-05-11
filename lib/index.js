'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Nanotimer = require('nanotimer');

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
  this._timer = new Nanotimer();
  return this;
}

util.inherits(UniformProcess, EventEmitter);

UniformProcess.prototype.start = function() {
  var self = this;
  self._interval = self._timer.setInterval(function() {
    self.emit('arrival');
  }, '', self._tickInterval + 'm');
  if (self._duration) {
    self._timer.setTimeout(function() {
      self.stop();
    }, '', (self._duration + self._tickInterval / 2) + 'm');
  }
  return self;
};

UniformProcess.prototype.stop = function() {
  this._timer.clearInterval();
  this.emit('finished');
  return this;
};

function PoissonProcess(mean, duration) {
  this._mean = mean;
  this._timeout = null;
  this._duration = duration * 1e6 || null; // ns
  this._elapsed = null;
  this._timer = new Nanotimer();
  return this;
}

util.inherits(PoissonProcess, EventEmitter);

PoissonProcess.prototype.start = function() {
  var dt = sample(this._mean);
  var started = process.hrtime();
  var self = this;
  self._timeout = self._timer.setTimeout(function() {
    var ended = process.hrtime(started);
    self._elapsed += (ended[0] * 1e9) + ended[1];
    if (self._duration && (self._elapsed >= self._duration)) {
      // done, nothing to clear
      self.emit('finished');
    } else {
      self.start();
      self.emit('arrival');
    }
  }, '', dt + 'm');
};

PoissonProcess.prototype.stop = function() {
  this._timer.clearTimeout(this._timeout);
  this.emit('finished');
};

function sample(l) {
  // http://wwwhome.math.utwente.nl/~scheinhardtwrw/ISP2013/sheets9.pdf
  return -Math.log(Math.random()) * l;
}
