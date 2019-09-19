import uuidv4 from 'uuid/v4';
import normalizeEmail from 'validator/lib/normalizeEmail';
import Attribute from './Attribute';
import Model from './Model';

export const STATUS_DELETED = 'deleted';
export const STATUS_PENDING = 'pending';
export const STATUS_VERIFIED = 'verified';
export const STATUS_CONFIRMED = 'confirmed';
export const STATUS_ENUM = {
  [STATUS_DELETED]: 0,
  [STATUS_PENDING]: 1,
  [STATUS_VERIFIED]: 2,
  [STATUS_CONFIRMED]: 3
};

const generateUuid = () => uuidv4();

export const attributes = [
  Attribute.string({ name: 'cognitoId', isRequired: true }),
  Attribute.string({ name: 'name', isRequired: true }),
  Attribute.string({ name: 'email', isRequired: true }),
  Attribute.string({
    name: 'uuid',
    isRequired: true,
    defaultValue: () => generateUuid()
  }),
  Attribute.enum({ name: 'status', members: STATUS_ENUM, defaultValue: STATUS_PENDING })
];

export default class User extends Model(attributes, 'User') {
  static generateUuid() {
    return generateUuid();
  }

  static attribsFromCognitoEvent(cognitoEvent) {
    const {
      userName,
      record: {
        userAttributes: { sub, email, name }
      }
    } = cognitoEvent;
    return {
      cognitoId: sub || userName,
      rawEmail: email,
      email: normalizeEmail(email),
      name
    };
  }
}
