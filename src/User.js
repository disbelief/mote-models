import uuidv4 from 'uuid/v4';
import normalizeEmail from 'validator/lib/normalizeEmail';
import Attribute from './Attribute';
import Model from './Model';

export const STATUS_DELETED = 'DELETED';
export const STATUS_PENDING = 'PENDING';
export const STATUS_VERIFIED = 'VERIFIED';
export const STATUS_CONFIRMED = 'CONFIRMED';
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
  Attribute.enum({ name: 'status', members: STATUS_ENUM, defaultValue: STATUS_PENDING }),
  Attribute.string({ name: 'challengeName', isRequired: false })
];

export default class User extends Model(attributes, 'User') {
  static STATUS_DELETED = STATUS_DELETED;

  static STATUS_PENDING = STATUS_PENDING;

  static STATUS_VERIFIED = STATUS_VERIFIED;

  static STATUS_CONFIRMED = STATUS_CONFIRMED;

  static STATUSES = {
    [STATUS_DELETED]: 0,
    [STATUS_PENDING]: 1,
    [STATUS_VERIFIED]: 2,
    [STATUS_CONFIRMED]: 3
  };

  static generateUuid() {
    return generateUuid();
  }

  static attribsFromCognitoEvent(cognitoEvent, overrides = {}) {
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
      name,
      ...overrides
    };
  }

  static attribsFromCognitoUser(cognitoUser, overrides = {}) {
    const { username: email, attributes, challengeName } = cognitoUser;
    // TODO any other built-in attribs we want to use eg. email_verified (bool)?
    let cognitoId;
    let status;
    if (attributes) {
      cognitoId = attributes.sub;
      status = attributes['custom:statusName'];
    }

    return {
      cognitoId,
      email,
      status,
      challengeName,
      ...overrides
    };
  }

  static attribsFromCognitoSignup(signupResult, overrides = {}) {
    const { user: cognitoUser, userSub: cognitoId } = signupResult;
    return User.attribsFromCognitoUser(cognitoUser, { cognitoId, ...overrides });
  }
}
