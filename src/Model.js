import { Record } from 'immutable';
import invariant from 'tiny-invariant';
import camelcase from 'camelcase';
import { isFunction } from 'lodash/lang';
import Attribute from './Attribute';

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

  const getAttribute = name => attributesMap[camelcase(name)];

  const prepareAttributeValue = (attribName, value, defaultIfNull = false) => {
    const attribute = getAttribute(attribName);
    invariant(!!attribute, `There is no ${attribName} attribute on the ${modelName} model`);
    if (defaultIfNull && value === null && isFunction(attribute.defaultValue)) {
      return attribute.prepareValue(attribute.defaultValue.apply(this));
    }
    return attribute.prepareValue(value);
  };

  return class extends Record(recordProps, modelName) {
    constructor(props) {
      const preparedProps = Object.keys(props).reduce(
        (result, propName) => ({
          ...result,
          [camelcase(propName)]: prepareAttributeValue(propName, props[propName], true)
        }),
        {}
      );
      // ensure we respect defaultValues for any attribute not specified in constructor
      Object.keys(recordProps).forEach(propName => {
        if (!preparedProps[propName]) {
          preparedProps[propName] = prepareAttributeValue(propName, recordProps[propName], true);
        }
      });
      super(preparedProps, modelName);
      this.errors = {};
      this.valid = true;
    }

    static attributes = attributesMap;

    static fromMysql(row) {
      const props = Object.keys(row).reduce(
        (attribs, col) => ({
          ...attribs,
          [camelcase(col)]: row[col]
        }),
        {}
      );
      console.log('fromMysql props: ', JSON.stringify(props));
      return new this(props);
    }

    set(attribName, value) {
      console.log('set', attribName, value);
      const preparedValue = prepareAttributeValue(attribName, value);
      console.log('set result:', preparedValue);
      return super.set(camelcase(attribName), preparedValue);
    }

    get(attribName) {
      const attribute = getAttribute(camelcase(attribName));
      const rawValue = super.get(camelcase(attribName));
      if (attribute.isEnum()) {
        return attribute.members[rawValue];
      }
      return rawValue;
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
