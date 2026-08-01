#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_SYSTEM_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_SYSTEM_HPP

#include "engine/terrain/TerrainSettingsComponent.hpp"
#include "engine/terrain/TerrainRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include <vector>
#include <cstdint>

namespace platform
{
    class TerrainSystem
    {
    public:
        TerrainSystem() = default;

        EntityID generate(Registry &registry, uint64_t seed, float length = 1000.0f);
        void regenerate(Registry &registry, EntityID terrainEntity, uint64_t seed);
        void destroySegment(Registry &registry, EntityID terrainEntity, uint32_t segmentIndex);

        [[nodiscard]] float getHeight(const TerrainSettingsComponent &settings, float x) const;
        void setSeed(TerrainSettingsComponent &settings, uint64_t seed);

        [[nodiscard]] uint64_t currentSeed(const TerrainRuntimeComponent &runtime) const { return runtime.currentSeed; }
        [[nodiscard]] uint32_t segmentCount(const TerrainRuntimeComponent &runtime) const { return runtime.generatedSegments; }
        [[nodiscard]] float terrainLength(const TerrainRuntimeComponent &runtime) const { return runtime.lastGeneratedX; }

        void Update(Registry &registry, double dt);
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_SYSTEM_HPP
