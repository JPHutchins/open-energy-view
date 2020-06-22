export const fillInPassiveUseBlanks = (data) => {
  let lastEntryY;

  for (let i = 0; i < data.size; i++) {
    let entryY = data.get(i).get('y');
    if (!isNaN(entryY) || entryY > 0) {
      lastEntryY = entryY;
      continue;
    }
    data = data.setIn([i, 'y'], lastEntryY)
  }

  return data;
};
