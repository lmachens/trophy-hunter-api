function getItemsPurchased({ timeline, participantId, from, minutes }) {
  if (!timeline.frames[from] || (minutes > 1 && !timeline.frames[from + minutes])) {
    return [];
  }
  return timeline.frames.slice(from, from + minutes).reduce((items, frame) => {
    const frameItems = frame.events
      .filter(event => {
        const soldSoon = frame.events.find(
          otherEvent =>
            otherEvent.participantId === participantId &&
            otherEvent.itemId === event.itemId &&
            otherEvent.type === 'ITEM_SOLD'
        );
        return (
          !soldSoon && event.participantId === participantId && event.type === 'ITEM_PURCHASED'
        );
      })
      .map(event => event.itemId);
    return [...new Set([...items, ...frameItems])];
  }, []);
}

export default getItemsPurchased;
