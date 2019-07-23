const getPosition = ({ role, lane }) => {
  if (lane === 'JUNGLE') {
    return 'JUNGLE';
  }

  switch (role) {
    case 'DUO':
    case 'DUO_CARRY':
      if (lane === 'MIDDLE') {
        return 'MIDDLE';
      }
      if (lane === 'TOP') {
        return 'TOP';
      }
      return 'BOTTOM';
    case 'DUO_SUPPORT':
      return 'UTILITY';
    case 'SOLO':
      if (lane === 'TOP') {
        return 'TOP';
      }
      if (lane === 'MIDDLE') {
        return 'MIDDLE';
      }
  }
  return 'TOP';
};

export default getPosition;
