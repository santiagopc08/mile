#ifndef PLATFORM_ENGINE_SCENE_PREFAB_PREFAB_MANAGER_HPP
#define PLATFORM_ENGINE_SCENE_PREFAB_PREFAB_MANAGER_HPP

#include "engine/scene/prefab/Prefab.hpp"
#include "engine/scene/Registry.hpp"
#include <unordered_map>

namespace platform
{
    class PrefabManager
    {
    public:
        PrefabManager() = default;

        PrefabData CreatePrefab(Registry &registry, EntityID rootEntity, const std::string &prefabName);
        EntityID InstantiatePrefab(Registry &registry, const PrefabData &prefab);

        bool ApplyOverrides(Registry &registry, EntityID prefabInstanceRoot);
        bool RevertOverrides(Registry &registry, EntityID prefabInstanceRoot);

        void RegisterPrefab(PrefabData prefab);
        [[nodiscard]] const PrefabData *GetPrefab(AssetID prefabID) const;

    private:
        std::unordered_map<AssetID, PrefabData> m_prefabs;
    };
}

#endif // PLATFORM_ENGINE_SCENE_PREFAB_PREFAB_MANAGER_HPP
