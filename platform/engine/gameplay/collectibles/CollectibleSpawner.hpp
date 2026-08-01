#ifndef PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_SPAWNER_HPP
#define PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_SPAWNER_HPP

#include "engine/scene/Registry.hpp"
#include "engine/terrain/TerrainManager.hpp"

namespace platform
{
    class CollectibleSpawner
    {
    public:
        CollectibleSpawner();

        void SpawnCollectiblesAlongTerrain(Registry &registry, const TerrainManager &terrainManager, float startX, float endX);
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_SPAWNER_HPP
