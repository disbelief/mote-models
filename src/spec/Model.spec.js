import { Record } from 'immutable';
import uuidv4 from 'uuid/v4';
import Model, { defaultAttributes } from '../Model';
import Attribute from '../Attribute';

describe('Model', () => {
  let statuses = { pending: 0, active: 1, disabled: 2 };
  let modelAttribs = [
    Attribute.string({ name: 'name', isRequired: true }),
    Attribute.boolean({ name: 'verified', defaultValue: false }),
    Attribute.string({ name: 'lorem', defaultValue: 'default ipsum' }),
    Attribute.string({ name: 'uuid', defaultValue: () => uuidv4() }),
    Attribute.enum({ name: 'status', defaultValue: 0, isRequired: true, members: statuses })
  ];
  let ModelClass;
  let instanceValues = {
    id: 1,
    name: 'custom name',
    verified: true,
    lorem: 'custom ipsum',
    status: 1,
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
      Object.keys(instanceValues).forEach(attrib => {
        const attribute = ModelClass.attributes[attrib];
        const expectedValue = attribute.unprepareValue(instanceValues[attrib]);
        expect(instance.get(attrib)).toBe(expectedValue);
      });
    });

    it('should ignore any props that are not defined attributes', () => {
      expect(() => {
        instance = new ModelClass({ ...instanceValues, invalidAttributeName: 1234 });
      }).not.toThrow();
      expect(instance).toBeDefined();
      expect(instance.invalidAttributeName).not.toBeDefined();
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
        status: 0,
        created_at: '2019-08-25 18:36:00',
        updated_at: '2019-08-25 18:36:00'
      };
    });

    it('creates an instance with the correct attributes', () => {
      instance = ModelClass.fromMysql(row);
      Object.keys(row).forEach(col => expect(instance.get(col)).toBeDefined());
    });
  });

  describe('isModel', () => {
    it('returns true when the argument is an instance of any model class', () => {
      instance = new ModelClass(instanceValues);
      class OtherModel extends Model(modelAttribs, 'OtherModel') {}
      const otherInstance = new OtherModel(instanceValues);
      expect(ModelClass.isModel(instance)).toBeTruthy();
      expect(ModelClass.isModel(otherInstance)).toBeTruthy();
    });

    it('returns false when the argument is not instance of any model class', () => {
      expect(ModelClass.isModel({})).toBeFalsy();
      expect(ModelClass.isModel(new Date())).toBeFalsy();
      expect(ModelClass.isModel('blah')).toBeFalsy();
      expect(ModelClass.isModel(1234567)).toBeFalsy();
    });
  });

  describe('isInstance', () => {
    it('returns true when the argument is an instance of the model class', () => {
      instance = new ModelClass(instanceValues);
      expect(ModelClass.isInstance(instance)).toBeTruthy();
    });

    it('returns false when the argument is not a model instance', () => {
      expect(ModelClass.isInstance({ id: 1 })).toBeFalsy();
    });

    it('returns false when the argument is an instance of a different model', () => {
      class OtherModel extends Model(modelAttribs, 'OtherModel') {}
      const otherInstance = new OtherModel(instanceValues);
      expect(ModelClass.isInstance(otherInstance)).toBeFalsy();
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

  describe('toObject', () => {
    beforeEach(() => {
      instance = new ModelClass(instanceValues);
    });

    it('returns a plain javascript object with all attributes present', () => {
      const result = instance.toObject();
      Object.keys(instanceValues).forEach(k => {
        expect(result[k]).toBe(instance.get(k));
      });
    });

    describe('when rawValue flag is set', () => {
      it('returns a plain javascript object with non-prepared attribute values', () => {
        const result = instance.toObject({ rawValues: true });
        expect(result['status']).not.toBe(instance.get('status'));
        expect(result['status']).toBe(instanceValues.status);
        Object.keys(instanceValues).forEach(k => {
          expect(result[k]).toBe(instanceValues[k]);
        });
      });
    });

    describe('when setOnly flag is set', () => {
      beforeEach(() => {
        instance = instance.set('id', null);
        instance = instance.set('name', null);
      });

      it('returns only key value pairs for attributes that are set to something', () => {
        const result = instance.toObject({ setOnly: true });
        expect(Object.keys(result)).not.toContain('id');
        expect(Object.keys(result)).not.toContain('name');
        Object.keys(instanceValues).forEach(k => {
          if (instance.get(k) !== null) {
            expect(result[k]).toBe(instance.get(k));
          } else {
            expect(Object.keys(result)).not.toContain(k);
          }
        });
      });
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
