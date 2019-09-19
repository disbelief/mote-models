import Attribute, { TYPES } from '../Attribute';

describe('Attribute', () => {
  describe('constructor', () => {
    it('requires a name and type option', () => {
      expect(() => new Attribute({ type: 'string' })).toThrow(/name/i);
      expect(() => new Attribute({ name: 'something' })).toThrow(/type/i);
    });

    it('requires a members option when type is enum', () => {
      expect(() => new Attribute({ name: 'status', type: 'enum' })).toThrow(/enum/i);
    });

    it('converts type to a symbol', () => {
      const attribute = new Attribute({ name: 'id', type: 'integer' });
      expect(attribute.type).toBe(TYPES.integer);
    });
  });

  describe('type helpers', () => {
    const attributeName = 'someAttribute';

    describe('#boolean', () => {
      it('creates an attribute of type boolean', () => {
        const attribute = Attribute.boolean({ name: attributeName, isRequired: true });
        expect(attribute.type).toBe(TYPES.boolean);
        expect(attribute.name).toBe(attributeName);
        expect(attribute.isRequired).toBe(true);
      });
    });

    describe('#integer', () => {
      it('creates an attribute of type integer', () => {
        const attribute = Attribute.integer({ name: attributeName, isRequired: true });
        expect(attribute.type).toBe(TYPES.integer);
        expect(attribute.name).toBe(attributeName);
        expect(attribute.isRequired).toBe(true);
      });
    });

    describe('#float', () => {
      it('creates an attribute of type float', () => {
        const attribute = Attribute.float({ name: attributeName, isRequired: true });
        expect(attribute.type).toBe(TYPES.float);
        expect(attribute.name).toBe(attributeName);
        expect(attribute.isRequired).toBe(true);
      });
    });

    describe('#string', () => {
      it('creates an attribute of type string', () => {
        const attribute = Attribute.string({ name: attributeName, isRequired: true });
        expect(attribute.type).toBe(TYPES.string);
        expect(attribute.name).toBe(attributeName);
        expect(attribute.isRequired).toBe(true);
      });
    });

    describe('#date', () => {
      it('creates an attribute of type date', () => {
        const attribute = Attribute.date({ name: attributeName, isRequired: true });
        expect(attribute.type).toBe(TYPES.date);
        expect(attribute.name).toBe(attributeName);
        expect(attribute.isRequired).toBe(true);
      });
    });

    describe('#enum', () => {
      it('creates an attribute of type enum', () => {
        const attribute = Attribute.enum({
          name: attributeName,
          isRequired: true,
          members: { zero: 0, one: 1 }
        });
        expect(attribute.type).toBe(TYPES.enum);
        expect(attribute.name).toBe(attributeName);
        expect(attribute.isRequired).toBe(true);
      });
    });
  });

  describe('prepareValue', () => {
    let attribute;

    describe('with enum attribute', () => {
      const members = { zero: 0, one: 1 };

      beforeEach(() => {
        attribute = Attribute.enum({ name: 'someAttribute', members });
      });

      it('converts a string to underlying enum value', () => {
        expect(attribute.prepareValue('one')).toBe(members.one);
        expect(attribute.prepareValue('zero')).toBe(members.zero);
      });

      it('throws an error if string does not map to enum value', () => {
        expect(() => attribute.prepareValue('thirty')).toThrow(/enum/);
      });
    });

    describe('with string attribute', () => {
      beforeEach(() => {
        attribute = Attribute.string({ name: 'someAttribute' });
      });

      it('returns the value given unchanged', () => {
        const newValue = 'something';
        expect(attribute.prepareValue(newValue)).toBe(newValue);
      });
    });
  });

  describe('isValid', () => {
    let attribute;

    describe('when isRequired', () => {
      beforeEach(() => {
        attribute = Attribute.string({ name: 'something', isRequired: true });
      });

      it('returns false when the value is null or undefined', () => {
        expect(attribute.isValid(null)).toBeFalsy();
        expect(attribute.isValid(undefined)).toBeFalsy();
      });

      it('returns true when the value is specified and correct', () => {
        expect(attribute.isValid('yes')).toBeTruthy();
      });
    });

    describe('enum', () => {
      let members = { zero: 0, one: 1 };

      beforeEach(() => {
        attribute = Attribute.enum({ name: 'something', members });
      });

      it('returns false when value is not a member of the enum', () => {
        expect(attribute.isValid('thirty')).toBeFalsy();
      });

      it('returns true when value is a member of the enum values', () => {
        expect(attribute.isValid(members.one)).toBeTruthy();
      });

      it('returns true when value is a member of the enum keys', () => {
        expect(attribute.isValid('one')).toBeTruthy();
      });
    });

    describe('boolean', () => {
      beforeEach(() => {
        attribute = Attribute.boolean({ name: 'something' });
      });

      it('returns true when value is a boolean', () => {
        expect(attribute.isValid(true)).toBeTruthy();
      });

      it('returns false when value is not a boolean', () => {
        expect(attribute.isValid('blah')).toBeFalsy();
      });
    });

    describe('integer', () => {
      beforeEach(() => {
        attribute = Attribute.integer({ name: 'something' });
      });

      it('returns true when value is a integer', () => {
        expect(attribute.isValid(10)).toBeTruthy();
      });

      it('returns false when value is not a integer', () => {
        expect(attribute.isValid('blah')).toBeFalsy();
      });
    });

    describe('float', () => {
      beforeEach(() => {
        attribute = Attribute.float({ name: 'something' });
      });

      it('returns true when value is a float', () => {
        expect(attribute.isValid(7.2)).toBeTruthy();
      });

      it('returns false when value is not a float', () => {
        expect(attribute.isValid('blah')).toBeFalsy();
      });
    });

    describe('string', () => {
      beforeEach(() => {
        attribute = Attribute.string({ name: 'something' });
      });

      it('returns true when value is a string', () => {
        expect(attribute.isValid('some string')).toBeTruthy();
      });

      it('returns false when value is not a string', () => {
        expect(attribute.isValid(123)).toBeFalsy();
      });
    });

    describe('date', () => {
      beforeEach(() => {
        attribute = Attribute.date({ name: 'something' });
      });

      it('returns true when value is a date', () => {
        expect(attribute.isValid(new Date())).toBeTruthy();
      });

      it('returns false when value is not a date', () => {
        expect(attribute.isValid('blah')).toBeFalsy();
      });
    });
  });
});
