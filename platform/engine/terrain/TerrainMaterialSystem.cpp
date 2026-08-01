#include "engine/terrain/TerrainMaterialSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    TerrainMaterialSystem::TerrainMaterialSystem()
    {
        // Register initial materials: Grass (0), Dirt (1), Rock (2)
        registerMaterial({0, "Grass", 0.6f, 0.1f, "assets://textures/grass.png", {0.2f, 0.8f, 0.2f, 1.0f}});
        registerMaterial({1, "Dirt", 0.8f, 0.05f, "assets://textures/dirt.png", {0.6f, 0.4f, 0.2f, 1.0f}});
        registerMaterial({2, "Rock", 0.4f, 0.2f, "assets://textures/rock.png", {0.5f, 0.5f, 0.5f, 1.0f}});
    }

    void TerrainMaterialSystem::registerMaterial(const TerrainMaterialSettingsComponent &mat)
    {
        m_materials[mat.id] = mat;
        LOG_INFO("[TerrainMaterialSystem] Registered terrain material '{}' (ID: {}, Friction: {:.2f}).",
                 mat.name, mat.id, mat.friction);
    }

    void TerrainMaterialSystem::removeMaterial(MaterialID id)
    {
        m_materials.erase(id);
    }

    MaterialID TerrainMaterialSystem::resolveMaterial(uint64_t seed, float worldX) const
    {
        uint64_t val = (static_cast<uint64_t>(worldX * 0.01f) ^ seed) % 3;
        return static_cast<MaterialID>(val);
    }

    void TerrainMaterialSystem::setMaterial(Registry &registry, EntityID terrainChunk, MaterialID id)
    {
        auto *runtime = registry.GetComponent<TerrainMaterialRuntimeComponent>(terrainChunk);
        if (!runtime)
        {
            runtime = &registry.AddComponent<TerrainMaterialRuntimeComponent>(terrainChunk);
        }
        runtime->activeMaterial = id;
        runtime->dirty = true;
    }

    std::optional<TerrainMaterialSettingsComponent> TerrainMaterialSystem::getMaterial(MaterialID id) const
    {
        auto it = m_materials.find(id);
        if (it != m_materials.end()) return it->second;
        return std::nullopt;
    }

    size_t TerrainMaterialSystem::materialUsage(MaterialID id) const
    {
        (void)id;
        return 1;
    }

    SubsystemProfilerMetrics TerrainMaterialSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.05;
        metrics.memoryUsageBytes = m_materials.size() * sizeof(TerrainMaterialSettingsComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = static_cast<uint32_t>(m_materials.size());
        metrics.lifetimeObjectsCreated = m_materials.size();
        return metrics;
    }
}
