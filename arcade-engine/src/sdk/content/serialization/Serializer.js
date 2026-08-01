export class Serializer {
  static serialize(pluginId, gameState = {}, pluginState = {}) {
    const payload = {
      header: {
        magic: 'ARCSAVE',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        checksum: Serializer._generateChecksum(gameState),
      },
      metadata: { pluginId },
      gameState,
      pluginState,
    };
    return JSON.stringify(payload, null, 2);
  }

  static _generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}
