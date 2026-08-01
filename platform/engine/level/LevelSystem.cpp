#include "engine/level/LevelSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool LevelSystem::loadLevel(Registry &registry, EntityID levelEntity, LevelID id, const std::string &name)
    {
        auto *settings = registry.GetComponent<LevelSettingsComponent>(levelEntity);
        auto *runtime = registry.GetComponent<LevelRuntimeComponent>(levelEntity);

        if (!settings) settings = &registry.AddComponent<LevelSettingsComponent>(levelEntity);
        if (!runtime) runtime = &registry.AddComponent<LevelRuntimeComponent>(levelEntity);

        settings->levelID = id;
        settings->name = name;

        runtime->state = LevelState::Playing;
        runtime->playTime = 0.0f;
        runtime->completed = false;

        LOG_INFO("[LevelSystem] Loaded level ID {} ('{}') on entity #{}.", id, name, levelEntity);
        return true;
    }

    void LevelSystem::reloadLevel(Registry &registry, EntityID levelEntity)
    {
        auto *settings = registry.GetComponent<LevelSettingsComponent>(levelEntity);
        LevelID id = settings ? settings->levelID : 1;
        std::string name = settings ? settings->name : "Level 1-1";
        unloadLevel(registry, levelEntity);
        loadLevel(registry, levelEntity, id, name);
    }

    void LevelSystem::unloadLevel(Registry &registry, EntityID levelEntity)
    {
        auto *runtime = registry.GetComponent<LevelRuntimeComponent>(levelEntity);
        if (runtime)
        {
            runtime->state = LevelState::Unload;
            LOG_INFO("[LevelSystem] Unloaded level on entity #{}.", levelEntity);
        }
    }

    void LevelSystem::restartLevel(Registry &registry, EntityID levelEntity)
    {
        reloadLevel(registry, levelEntity);
    }

    void LevelSystem::completeLevel(Registry &registry, EntityID levelEntity)
    {
        auto *runtime = registry.GetComponent<LevelRuntimeComponent>(levelEntity);
        if (!runtime) runtime = &registry.AddComponent<LevelRuntimeComponent>(levelEntity);

        runtime->completed = true;
        runtime->state = LevelState::Completed;
        LOG_INFO("[LevelSystem] Level on entity #{} completed!", levelEntity);
    }

    LevelState LevelSystem::levelState(Registry &registry, EntityID levelEntity) const
    {
        auto *runtime = registry.GetComponent<LevelRuntimeComponent>(levelEntity);
        return runtime ? runtime->state : LevelState::Unload;
    }

    bool LevelSystem::isCompleted(Registry &registry, EntityID levelEntity) const
    {
        auto *runtime = registry.GetComponent<LevelRuntimeComponent>(levelEntity);
        return runtime ? runtime->completed : false;
    }

    float LevelSystem::playTime(Registry &registry, EntityID levelEntity) const
    {
        auto *runtime = registry.GetComponent<LevelRuntimeComponent>(levelEntity);
        return runtime ? runtime->playTime : 0.0f;
    }

    void LevelSystem::Update(Registry &registry, double dt)
    {
        float delta = static_cast<float>(dt);
        auto view = registry.GetView<LevelRuntimeComponent>();
        view.Each([delta](EntityID, LevelRuntimeComponent &runtime) {
            if (runtime.state == LevelState::Playing)
            {
                runtime.playTime += delta;
            }
        });
    }

    SubsystemProfilerMetrics LevelSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.05;
        metrics.memoryUsageBytes = sizeof(LevelRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
