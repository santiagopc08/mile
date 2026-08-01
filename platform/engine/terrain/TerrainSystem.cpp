#include "engine/terrain/TerrainSystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/core/Logger.hpp"
#include <cmath>

namespace platform
{
    EntityID TerrainSystem::generate(Registry &registry, uint64_t seed, float length)
    {
        EntityID terrainEntity = registry.CreateEntity("ProceduralTerrain");
        auto &settings = registry.AddComponent<TerrainSettingsComponent>(terrainEntity);
        auto &runtime = registry.AddComponent<TerrainRuntimeComponent>(terrainEntity);

        settings.seed = seed;
        runtime.currentSeed = seed;
        runtime.lastGeneratedX = length;
        runtime.generatedSegments = static_cast<uint32_t>(length / settings.segmentLength);

        LOG_INFO("[TerrainSystem] Generated procedural terrain from seed {} (Length: {:.1f}m, Segments: {}).",
                 seed, length, runtime.generatedSegments);
        return terrainEntity;
    }

    void TerrainSystem::regenerate(Registry &registry, EntityID terrainEntity, uint64_t seed)
    {
        auto *settings = registry.GetComponent<TerrainSettingsComponent>(terrainEntity);
        auto *runtime = registry.GetComponent<TerrainRuntimeComponent>(terrainEntity);
        if (settings && runtime)
        {
            settings->seed = seed;
            runtime->currentSeed = seed;
            LOG_INFO("[TerrainSystem] Regenerated terrain entity #{} with seed {}.", terrainEntity, seed);
        }
    }

    void TerrainSystem::destroySegment(Registry &registry, EntityID terrainEntity, uint32_t segmentIndex)
    {
        (void)registry;
        (void)terrainEntity;
        (void)segmentIndex;
    }

    float TerrainSystem::getHeight(const TerrainSettingsComponent &settings, float x) const
    {
        // Deterministic sinusoidal / multi-frequency terrain height formula
        float f1 = settings.frequency;
        float f2 = settings.frequency * 2.5f;
        float phase = static_cast<float>(settings.seed % 1000) * 0.01f;

        float h1 = std::sin(x * f1 + phase) * settings.amplitude;
        float h2 = std::cos(x * f2 + phase) * (settings.amplitude * 0.3f);
        return h1 + h2 + 250.0f; // Base ground Y = 250
    }

    void TerrainSystem::setSeed(TerrainSettingsComponent &settings, uint64_t seed)
    {
        settings.seed = seed;
    }

    void TerrainSystem::Update(Registry &registry, double dt)
    {
        (void)dt;
        auto view = registry.GetView<TerrainSettingsComponent, TerrainRuntimeComponent>();
        view.Each([](EntityID entity, TerrainSettingsComponent &settings, TerrainRuntimeComponent &runtime) {
            (void)entity;
            runtime.currentSeed = settings.seed;
        });
    }
}
