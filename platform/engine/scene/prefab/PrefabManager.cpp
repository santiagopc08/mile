#include "engine/scene/prefab/PrefabManager.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/scene/components/PrefabComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    PrefabData PrefabManager::CreatePrefab(Registry &registry, EntityID rootEntity, const std::string &prefabName)
    {
        PrefabData prefab;
        prefab.Name = prefabName;
        prefab.ID = HashAssetUUID("uuid-prefab-" + prefabName);

        if (auto *nameComp = registry.GetComponent<NameComponent>(rootEntity))
        {
            prefab.RootEntity.Name = nameComp->Name;
        }

        if (auto *tagComp = registry.GetComponent<TagComponent>(rootEntity))
        {
            prefab.RootEntity.Tag = tagComp->Tag;
            prefab.RootEntity.Layer = tagComp->Layer;
        }

        if (auto *transform = registry.GetComponent<TransformComponent>(rootEntity))
        {
            prefab.RootEntity.Position = transform->Position;
            prefab.RootEntity.Rotation = transform->Rotation;
            prefab.RootEntity.Scale = transform->Scale;
        }

        RegisterPrefab(prefab);
        LOG_INFO("[PrefabManager] Created prefab '{}' (ID: {}).", prefab.Name, prefab.ID);
        return prefab;
    }

    EntityID PrefabManager::InstantiatePrefab(Registry &registry, const PrefabData &prefab)
    {
        EntityID entity = registry.CreateEntity(prefab.RootEntity.Name);

        if (auto *tagComp = registry.GetComponent<TagComponent>(entity))
        {
            tagComp->Tag = prefab.RootEntity.Tag;
            tagComp->Layer = prefab.RootEntity.Layer;
        }

        auto &transform = registry.AddComponent<TransformComponent>(entity);
        transform.Position = prefab.RootEntity.Position;
        transform.Rotation = prefab.RootEntity.Rotation;
        transform.Scale = prefab.RootEntity.Scale;

        auto &prefabComp = registry.AddComponent<PrefabComponent>(entity);
        prefabComp.PrefabID = prefab.ID;
        prefabComp.IsOverridden = false;

        LOG_INFO("[PrefabManager] Instantiated prefab '{}' -> Entity #{}.", prefab.Name, entity);
        return entity;
    }

    bool PrefabManager::ApplyOverrides(Registry &registry, EntityID prefabInstanceRoot)
    {
        auto *prefabComp = registry.GetComponent<PrefabComponent>(prefabInstanceRoot);
        if (!prefabComp || prefabComp->PrefabID == kInvalidAssetID)
        {
            return false;
        }

        prefabComp->IsOverridden = false;
        LOG_INFO("[PrefabManager] Applied overrides for prefab instance Entity #{}.", prefabInstanceRoot);
        return true;
    }

    bool PrefabManager::RevertOverrides(Registry &registry, EntityID prefabInstanceRoot)
    {
        auto *prefabComp = registry.GetComponent<PrefabComponent>(prefabInstanceRoot);
        if (!prefabComp || prefabComp->PrefabID == kInvalidAssetID)
        {
            return false;
        }

        const PrefabData *prefab = GetPrefab(prefabComp->PrefabID);
        if (prefab)
        {
            if (auto *transform = registry.GetComponent<TransformComponent>(prefabInstanceRoot))
            {
                transform->Position = prefab->RootEntity.Position;
                transform->Rotation = prefab->RootEntity.Rotation;
                transform->Scale = prefab->RootEntity.Scale;
            }
        }

        prefabComp->IsOverridden = false;
        LOG_INFO("[PrefabManager] Reverted overrides for prefab instance Entity #{}.", prefabInstanceRoot);
        return true;
    }

    void PrefabManager::RegisterPrefab(PrefabData prefab)
    {
        m_prefabs[prefab.ID] = std::move(prefab);
    }

    const PrefabData *PrefabManager::GetPrefab(AssetID prefabID) const
    {
        auto it = m_prefabs.find(prefabID);
        if (it != m_prefabs.end())
        {
            return &it->second;
        }
        return nullptr;
    }
}
