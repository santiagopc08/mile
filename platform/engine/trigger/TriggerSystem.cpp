#include "engine/trigger/TriggerSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void TriggerSystem::registerTrigger(Registry &registry, EntityID triggerEntity, uint32_t id, TriggerCondition condition, TriggerAction action)
    {
        auto *settings = registry.GetComponent<TriggerSettingsComponent>(triggerEntity);
        auto *runtime = registry.GetComponent<TriggerRuntimeComponent>(triggerEntity);

        if (!settings) settings = &registry.AddComponent<TriggerSettingsComponent>(triggerEntity);
        if (!runtime) runtime = &registry.AddComponent<TriggerRuntimeComponent>(triggerEntity);

        settings->triggerID = id;
        settings->condition = condition;
        settings->action = action;
        settings->active = true;
        runtime->state = TriggerState::Ready;
        LOG_INFO("[TriggerSystem] Registered trigger ID {} on entity #{}.", id, triggerEntity);
    }

    void TriggerSystem::unregisterTrigger(Registry &registry, EntityID triggerEntity)
    {
        auto *runtime = registry.GetComponent<TriggerRuntimeComponent>(triggerEntity);
        if (runtime) runtime->state = TriggerState::Destroyed;
    }

    void TriggerSystem::activate(Registry &registry, EntityID triggerEntity)
    {
        auto *settings = registry.GetComponent<TriggerSettingsComponent>(triggerEntity);
        if (settings) settings->active = true;
    }

    void TriggerSystem::deactivate(Registry &registry, EntityID triggerEntity)
    {
        auto *settings = registry.GetComponent<TriggerSettingsComponent>(triggerEntity);
        if (settings) settings->active = false;
    }

    bool TriggerSystem::fire(Registry &registry, EntityID triggerEntity, uint64_t currentTick)
    {
        auto *settings = registry.GetComponent<TriggerSettingsComponent>(triggerEntity);
        auto *runtime = registry.GetComponent<TriggerRuntimeComponent>(triggerEntity);

        if (!settings || !runtime || !settings->active || runtime->state == TriggerState::Completed) return false;

        if (settings->condition == TriggerCondition::Once && runtime->executionCount >= 1)
        {
            runtime->state = TriggerState::Completed;
            return false;
        }

        runtime->state = TriggerState::Executing;
        runtime->executionCount++;
        runtime->lastExecutionTick = currentTick;

        LOG_INFO("[TriggerSystem] Fired trigger ID {} (Action: {}) on entity #{} at tick {}.",
                 settings->triggerID, static_cast<int>(settings->action), triggerEntity, currentTick);

        if (settings->condition == TriggerCondition::Once)
        {
            runtime->state = TriggerState::Completed;
        }
        else
        {
            runtime->state = TriggerState::Ready;
        }
        return true;
    }

    void TriggerSystem::reset(Registry &registry, EntityID triggerEntity)
    {
        auto *runtime = registry.GetComponent<TriggerRuntimeComponent>(triggerEntity);
        if (runtime)
        {
            runtime->state = TriggerState::Ready;
            runtime->executionCount = 0;
            runtime->lastExecutionTick = 0;
        }
    }

    TriggerState TriggerSystem::triggerState(Registry &registry, EntityID triggerEntity) const
    {
        auto *runtime = registry.GetComponent<TriggerRuntimeComponent>(triggerEntity);
        return runtime ? runtime->state : TriggerState::Created;
    }

    uint32_t TriggerSystem::triggerCount(Registry &registry) const
    {
        auto view = registry.GetView<TriggerSettingsComponent, TriggerRuntimeComponent>();
        uint32_t count = 0;
        for (auto e : view) { (void)e; count++; }
        return count;
    }

    uint32_t TriggerSystem::executedTriggers(Registry &registry, EntityID triggerEntity) const
    {
        auto *runtime = registry.GetComponent<TriggerRuntimeComponent>(triggerEntity);
        return runtime ? runtime->executionCount : 0;
    }

    uint64_t TriggerSystem::lastExecutionTick(Registry &registry, EntityID triggerEntity) const
    {
        auto *runtime = registry.GetComponent<TriggerRuntimeComponent>(triggerEntity);
        return runtime ? runtime->lastExecutionTick : 0;
    }

    SubsystemProfilerMetrics TriggerSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.01;
        metrics.memoryUsageBytes = sizeof(TriggerRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
