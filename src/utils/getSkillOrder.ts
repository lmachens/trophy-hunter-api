function getSkillOrder({ timeline, participantId }) {
  return timeline.frames.reduce((skillOrder, frame) => {
    return [
      ...skillOrder,
      ...frame.events
        .filter(
          event =>
            event.participantId === participantId &&
            event.type === 'SKILL_LEVEL_UP' &&
            event.levelUpType === 'NORMAL'
        )
        .map(event => event.skillSlot)
    ];
  }, []);
}

export default getSkillOrder;
