import { Record } from 'immutable';
import camelcase from 'camelcase';
import { isFunction } from 'lodash/lang';
import Attribute from './Attribute';
import invariant from './util/invariant';

export const defaultAttributes = [
  Attribute.integer({ name: 'id' }), // TODO isRequired only for persisted records
  Attribute.date({ name: 'createdAt' }),
  Attribute.date({ name: 'updatedAt' })
];

const Model = (attributes, modelName = 'Model') => {
  const attributesMap = {};
  const recordProps = {};
  [...defaultAttributes, ...attributes].forEach(attribute => {
    if (isFunction(attribute.defaultValue)) {
      recordProps[attribute.name] = attribute.prepareValue(null);
    } else {
      recordProps[attribute.name] = attribute.prepareValue(attribute.defaultValue);
    }
    attributesMap[attribute.name] = attribute;
  });

  const normalizeName = name => camelcase(name);

  const getAttribute = name => attributesMap[normalizeName(name)];

  const prepareAttributeValue = (attribName, value, defaultIfNull = false) => {
    const attribute = getAttribute(attribName);
    invariant(!!attribute, `There is no ${attribName} attribute on the ${modelName} model`);
    if (
      defaultIfNull &&
      (value === null || typeof value === 'undefined') &&
      isFunction(attribute.defaultValue)
    ) {
      return attribute.prepareValue(attribute.defaultValue());
    }
    return attribute.prepareValue(value);
  };

  return class extends Record(recordProps, modelName) {
    constructor(props) {
      const preparedProps = Object.keys(props).reduce((result, propName) => {
        // ignore props that don't match any defined attribute
        if (getAttribute(propName)) {
          return {
            ...result,
            [normalizeName(propName)]: prepareAttributeValue(propName, props[propName], true)
          };
        }
        return result;
      }, {});
      // ensure we respect defaultValues for any attribute not specified in constructor
      Object.keys(recordProps).forEach(propName => {
        if (preparedProps[propName] === null || typeof preparedProps[propName] === 'undefined') {
          preparedProps[propName] = prepareAttributeValue(propName, recordProps[propName], true);
        }
      });
      super(preparedProps, modelName);
      this.errors = {};
      this.valid = true;
    }

    static attributes = attributesMap;

    static isModel(maybeModel) {
      return Record.isRecord(maybeModel);
    }

    static isInstance(maybeModel) {
      return Record.isRecord(maybeModel) && Record.getDescriptiveName(maybeModel) === modelName;
    }

    static fromMysql(row) {
      const props = Object.keys(row).reduce(
        (attribs, col) => ({
          ...attribs,
          [normalizeName(col)]: row[col]
        }),
        {}
      );
      return new this(props);
    }

    set(attribName, rawValue) {
      const normalizedName = normalizeName(attribName);
      const preparedValue = prepareAttributeValue(normalizedName, rawValue);
      return super.set(normalizedName, preparedValue);
    }

    setRaw(attribName, rawValue) {
      return super.set(normalizeName(attribName), rawValue);
    }

    get(attribName) {
      const attribute = getAttribute(normalizeName(attribName));
      invariant(!!attribute, `There is no ${attribName} attribute on the ${modelName} model`);
      const rawValue = super.get(attribute.name);
      return attribute.unprepareValue(rawValue);
    }

    // makes no attempt to transform the output that is stored
    // (eg. by dereferencing from an enum)
    getRaw(attribName) {
      return super.get(normalizeName(attribName));
    }

    /**
     * Returns all attributes of the model as a POJO
     *
     * @param {Boolean} rawValues flag indicates whether to skip preparing values
     * @param {Boolean} setOnly flag indicates whether to omit null/undefined
     * keys + values from the result.
     */
    toObject({ rawValues = false, setOnly = false } = {}) {
      return Object.keys(attributesMap).reduce((obj, key) => {
        const value = rawValues ? this.getRaw(key) : this.get(key);
        if (setOnly) {
          if (value !== null && typeof value !== 'undefined') {
            return {
              ...obj,
              [key]: value
            };
          } else {
            return obj;
          }
        }
        return {
          ...obj,
          [key]: value
        };
      }, {});
    }

    isValid() {
      this.valid = true;
      this.errors = {};
      Object.values(attributesMap).forEach(attribute => {
        if (!attribute.isValid(this.get(attribute.name))) {
          this.errors[attribute.name] = 'is invalid';
          this.valid = false;
        }
      });
      return this.valid;
    }

    errorMessage() {
      return Object.keys(this.errors).reduce(
        (message, key) => `${message}. ${this.errors[key]}`,
        ''
      );
    }
  };
};

export default Model;
