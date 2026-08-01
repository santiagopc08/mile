#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_SYSTEM_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_SYSTEM_HPP

#include "engine/terrain/TerrainMaterialSettingsComponent.hpp"
#include "engine/terrain/TerrainMaterialRuntimeComponent.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"
#include "engine/scene/Registry.hpp"
#include <unordered_map>
#include <optional>
#include <vector>

namespace platform
{
    class TerrainMaterialSystem : public IRuntimeProfiler
    {
    public:
        TerrainMaterialSystem();

        void registerMaterial(const TerrainMaterialSettingsComponent &mat);
        void removeMaterial(MaterialID id);

        [[nodiscard]] MaterialID resolveMaterial(uint64_t seed, float worldX) const;
        void setMaterial(Registry &registry, EntityID terrainChunk, MaterialID id);
        [[nodiscard]] std::optional<TerrainMaterialSettingsComponent> getMaterial(MaterialID id) const;

        [[nodiscard]] size_t materialCount() const { return m_materials.size(); }
        [[nodiscard]] size_t materialUsage(MaterialID id) const;
        [[nodiscard]] MaterialID activeMaterial(const TerrainMaterialRuntimeComponent &runtime) const { return runtime.activeMaterial; }

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;

    private:
        std::unordered_map<MaterialID, TerrainMaterialSettingsComponent> m_materials;
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_SYSTEM_HPP
