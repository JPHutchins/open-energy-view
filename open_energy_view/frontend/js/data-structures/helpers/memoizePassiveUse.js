//Impure function

export const memoizePassiveUse = (instance, f) => {
  //TODO - either forking
  if (!instance.memo.passiveUse) {
    instance.memo.passiveUse = {};
  }
  const stringRep =
    instance.friendlyName +
    instance.lastUpdate +
    instance.database.first() +
    instance.database.last();
  if (instance.memo.passiveUse[stringRep])
    return instance.memo.passiveUse[stringRep];
  instance.memo.passiveUse[stringRep] = f(instance.database).value;
  return instance.memo.passiveUse[stringRep];
};
