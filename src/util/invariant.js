export default (condition, message = 'invariant failed') => {
  const truthy = Boolean(condition);
  if (truthy) {
    return true;
  }
  throw new Error(message);
};
