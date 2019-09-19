"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Model = _interopRequireDefault(require("./src/Model"));

var _Attribute = _interopRequireDefault(require("./src/Attribute"));

var _User = _interopRequireDefault(require("./src/User"));

var _default = {
  Model: _Model.default,
  Attribute: _Attribute.default,
  User: _User.default
};
exports.default = _default;
