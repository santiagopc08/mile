#include "engine/level/progression/ProgressionSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void ProgressionSystem::unlock(Registry &registry, EntityID entity, LevelID levelID)
    {
        auto *runtime = registry.GetComponent<ProgressionRuntimeComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<ProgressionRuntimeComponent>(entity);

        runtime->unlockedLevels.insert(levelID);
        LOG_INFO("[ProgressionSystem] Unlocked Level ID {} on entity #{}.", levelID, entity);
    }

    void ProgressionSystem::complete(Registry &registry, EntityID entity, LevelID levelID)
    {
        auto *settings = registry.GetComponent<ProgressionSettingsComponent>(entity);
        auto *runtime = registry.GetComponent<ProgressionRuntimeComponent>(entity);

        if (!settings) settings = &registry.AddComponent<ProgressionSettingsComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<ProgressionRuntimeComponent>(entity);

        runtime->completion = 100.0f;
        LOG_INFO("[ProgressionSystem] Completed Level ID {} on entity #{}.", levelID, entity);

        if (settings->unlockNextLevel)
        {
            unlock(registry, entity, levelID + 1);
        }
    }

    void ProgressionSystem::saveProgress(Registry &registry, EntityID entity)
    {
        LOG_INFO("[ProgressionSystem] Saved progress state for entity #{}.", entity);
    }

    void ProgressionSystem::loadProgress(Registry &registry, EntityID entity)
    {
        auto *runtime = registry.GetComponent<ProgressionRuntimeComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<ProgressionRuntimeComponent>(entity);

        runtime->unlockedLevels.insert(1);
        LOG_INFO("[ProgressionSystem] Loaded progress state for entity #{}.", entity);
    }

    bool ProgressionSystem::isUnlocked(Registry &registry, EntityID entity, LevelID levelID) const
    {
        auto *runtime = registry.GetComponent<ProgressionRuntimeComponent>(entity);
        return runtime ? runtime->unlockedLevels.contains(levelID) : (levelID == 1);
    }

    float ProgressionSystem::completionPercentage(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<ProgressionRuntimeComponent>(entity);
        return runtime ? runtime->completion : 0.0f;
    }
}
