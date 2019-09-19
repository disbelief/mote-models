import { Record } from 'immutable';
import uuidv4 from 'uuid/v4';
import Model, { defaultAttributes } from '../Model';
import Attribute from '../Attribute';

describe('Model', () => {
  let modelAttribs = [
    Attribute.string({ name: 'name', isRequired: true }),
    Attribute.boolean({ name: 'verified', defaultValue: false }),
    Attribute.string({ name: 'lorem', defaultValue: 'default ipsum' }),
    Attribute.string({ name: 'uuid', defaultValue: () => uuidv4() })
  ];
  let ModelClass;
  let instanceValues = {
    id: 1,
    name: 'custom name',
    verified: true,
    lorem: 'custom ipsum',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  let instance;

  beforeEach(() => {
    ModelClass = class SpecModel extends Model(modelAttribs, 'SpecModel') {};
  });

  describe('class', () => {
    it('should not use same defaultValue for multiple instances', () => {
      instance = new ModelClass(instanceValues);
      const instance2 = new ModelClass(instanceValues);
      expect(instance.get('uuid')).toBeDefined();
      expect(instance2.get('uuid')).toBeDefined();
      expect(instance.get('uuid')).not.toBe(instance2.get('uuid'));
    });

    it('should create a model factory with the attributes specified', () => {
      console.log('ModelClass: ', ModelClass);
      expect(ModelClass).toBeDefined();
      expect(ModelClass.attributes).toBeDefined();
      modelAttribs.forEach(attrib =>
        expect(ModelClass.attributes[attrib.name]).toMatchObject(attrib)
      );
    });

    it('should include default attributes', () => {
      defaultAttributes.forEach(attrib =>
        expect(ModelClass.attributes[attrib.name]).toMatchObject(attrib)
      );
    });

    it('should set the record name correctly', () => {
      instance = new ModelClass(instanceValues);
      expect(Record.getDescriptiveName(instance)).toBe('SpecModel');
    });
  });

  describe('constructor', () => {
    it('should instantiate a model with the correct attribute values', () => {
      instance = new ModelClass(instanceValues);
      Object.keys(instanceValues).forEach(attrib =>
        expect(instance.get(attrib)).toBe(instanceValues[attrib])
      );
    });
  });

  describe('fromMysql', () => {
    let row;

    beforeEach(() => {
      row = {
        id: 1,
        name: 'John Doe',
        lorem: 'dolor',
        verified: true,
        created_at: '2019-08-25 18:36:00',
        updated_at: '2019-08-25 18:36:00'
      };
    });

    it('creates an instance with the correct attributes', () => {
      instance = ModelClass.fromMysql(row);
      console.log(instance);
      Object.keys(row).forEach(col => expect(instance.get(col)).toBeDefined());
    });
  });

  describe('get', () => {
    beforeEach(() => {
      instance = new ModelClass(instanceValues);
    });

    it('gets attribute values via exact name and snake_case', () => {
      expect(instance.get('created_at')).toBeDefined();
      expect(instance.get('created_at')).toBe(instance.get('createdAt'));
    });
  });

  describe('set', () => {
    beforeEach(() => {
      instance = new ModelClass(instanceValues);
    });

    it('prepares the value before setting', () => {
      const attribute = ModelClass.attributes.name;
      const newValue = 'updated name';
      const prepareMock = jest.fn(v => v);
      attribute.prepareValue = prepareMock.bind(attribute);
      instance.set('name', newValue);
      expect(prepareMock).toBeCalledWith(newValue);
    });
  });

  describe('isValid', () => {
    const invalidInstanceValues = { ...instanceValues, name: null };
    let invalidInstance;
    let validInstance;

    beforeEach(() => {
      invalidInstance = new ModelClass(invalidInstanceValues);
      validInstance = new ModelClass(instanceValues);
    });

    it('marks an error when an attribute is invalid', () => {
      expect(invalidInstance.isValid()).toBeFalsy();
      expect(Object.keys(invalidInstance.errors)).toContain('name');
      expect(invalidInstance.valid).toBeFalsy();
    });

    it('does not mark an error and returns true when attributes are valid', () => {
      expect(validInstance.isValid()).toBeTruthy();
      expect(Object.keys(validInstance.errors).length).toBe(0);
      expect(validInstance.valid).toBeTruthy();
    });
  });
});
