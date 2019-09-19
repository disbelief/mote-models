import invariant from 'tiny-invariant';
import { isFunction, isNumber, isInteger, isString, isBoolean, isDate } from 'lodash/lang';

export const TYPE_BOOLEAN = 'boolean';
export const TYPE_INTEGER = 'integer';
export const TYPE_FLOAT = 'float';
export const TYPE_STRING = 'string';
export const TYPE_DATE = 'date';
export const TYPE_ENUM = 'enum';
export const TYPES = {
  boolean: TYPE_BOOLEAN,
  integer: TYPE_INTEGER,
  float: TYPE_FLOAT,
  string: TYPE_STRING,
  date: TYPE_DATE,
  enum: TYPE_ENUM
};

export default class Attribute {
  constructor({ name, type, isRequired = false, defaultValue = null, members = null }) {
    invariant(isString(name), 'A name is required for all attributes');
    invariant(isString(type), 'A type is required for all attributes');
    this.name = name;
    this.type = TYPES[type.toLowerCase()];
    invariant(
      isString(this.type),
      'A valid type is required for all attributes, see Attribute.TYPES'
    );

    this.isRequired = isRequired;
    this.defaultValue = defaultValue;
    if (this.isEnum()) {
      if (!members || members.length === 0) {
        throw new Error(`Enum attribute ${name} declared without any members`);
      }
      this.members = members;
    }
  }

  getDefaultValue() {
    return isFunction(this.defaultValue) ? this.defaultValue() : this.defaultValue;
  }

  prepareValue(rawValue) {
    if (this.type === TYPE_ENUM && !isInteger(rawValue)) {
      const intValue = this.members[rawValue];
      invariant(
        typeof intValue !== 'undefined',
        `Value ${rawValue} is not a member of the ${this.name} enum`
      );
      return intValue;
    }
    // TODO: possibly some other formatting/normalizing for mysql?
    // TODO: possibly a custom prepare() function?
    return rawValue;
  }

  isValid(value) {
    if ((this.isRequired && value === null) || typeof value === 'undefined') {
      return false;
    }
    if (value) {
      switch (this.type) {
        case TYPE_BOOLEAN:
          return isBoolean(value);
        case TYPE_INTEGER:
          return isInteger(value);
        case TYPE_FLOAT:
          return isNumber(value);
        case TYPE_STRING:
          return isString(value);
        case TYPE_DATE:
          return isDate(value);
        case TYPE_ENUM:
          if (isString(value)) {
            return !!this.members[value];
          }
          return !!Object.keys(this.members).find(k => this.members[k] === value);
        default:
          return false;
      }
    }
    return true;
  }

  static boolean(opts = {}) {
    return new this({ ...opts, type: TYPE_BOOLEAN });
  }

  static integer(opts = {}) {
    return new this({ ...opts, type: TYPE_INTEGER });
  }

  static float(opts = {}) {
    return new this({ ...opts, type: TYPE_FLOAT });
  }

  static string(opts = {}) {
    return new this({ ...opts, type: TYPE_STRING });
  }

  static date(opts = {}) {
    return new this({ ...opts, type: TYPE_DATE });
  }

  static enum(opts = {}) {
    return new this({ ...opts, type: TYPE_ENUM });
  }

  isBoolean() {
    return this.type === TYPE_BOOLEAN;
  }

  isInteger() {
    return this.type === TYPE_INTEGER;
  }

  isFloat() {
    return this.type === TYPE_FLOAT;
  }

  isString() {
    return this.type === TYPE_STRING;
  }

  isDate() {
    return this.type === TYPE_DATE;
  }

  isEnum() {
    return this.type === TYPE_ENUM;
  }
}
