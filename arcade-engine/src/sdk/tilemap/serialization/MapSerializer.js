export class MapSerializer {
  static serialize(tileMap) {
    const data = {
      name: tileMap.name,
      width: tileMap.width,
      height: tileMap.height,
      tileSize: tileMap.tileSize,
      layers: [],
    };
    tileMap.layers.forEach((layer) => {
      data.layers.push({
        name: layer.name,
        visible: layer.visible,
      });
    });
    return JSON.stringify(data, null, 2);
  }
}
