export const idToIndex = (id) => {
  const matches = id.match(/\$\$-(\d)/);
  return matches ? parseInt(matches[1]) : null;
};
