#include "engine/gameplay/modifiers/ModifierSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void ModifierSystem::applyModifier(Registry &registry, EntityID entity, uint32_t id, ModifierType type, float value, ModifierOperation op, float duration)
    {
        auto *settings = registry.GetComponent<ModifierSettingsComponent>(entity);
        auto *runtime = registry.GetComponent<ModifierRuntimeComponent>(entity);

        if (!settings) settings = &registry.AddComponent<ModifierSettingsComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<ModifierRuntimeComponent>(entity);

        settings->id = id;
        settings->type = type;
        settings->value = value;
        settings->operation = op;
        settings->duration = duration;

        runtime->active = true;
        runtime->remainingTime = duration;
        runtime->appliedValue = value;

        LOG_INFO("[ModifierSystem] Applied modifier ID {} (Type: {}, Value: {:.2f}) to entity #{}.",
                 id, static_cast<int>(type), value, entity);
    }

    void ModifierSystem::removeModifier(Registry &registry, EntityID entity, uint32_t)
    {
        auto *runtime = registry.GetComponent<ModifierRuntimeComponent>(entity);
        if (runtime)
        {
            runtime->active = false;
            LOG_INFO("[ModifierSystem] Removed modifier from entity #{}.", entity);
        }
    }

    bool ModifierSystem::hasModifier(Registry &registry, EntityID entity, uint32_t id) const
    {
        auto *settings = registry.GetComponent<ModifierSettingsComponent>(entity);
        auto *runtime = registry.GetComponent<ModifierRuntimeComponent>(entity);
        return (settings && runtime && settings->id == id && runtime->active);
    }

    void ModifierSystem::clearModifiers(Registry &registry, EntityID entity)
    {
        auto *runtime = registry.GetComponent<ModifierRuntimeComponent>(entity);
        if (runtime) runtime->active = false;
    }

    void ModifierSystem::Update(Registry &registry, double dt)
    {
        auto view = registry.GetView<ModifierSettingsComponent, ModifierRuntimeComponent>();
        for (auto entity : view)
        {
            auto *settings = registry.GetComponent<ModifierSettingsComponent>(entity);
            auto *runtime = registry.GetComponent<ModifierRuntimeComponent>(entity);

            if (!settings || !runtime || !runtime->active) continue;

            if (settings->duration > 0.0f)
            {
                runtime->remainingTime -= dt;
                if (runtime->remainingTime <= 0.0)
                {
                    runtime->active = false;
                    LOG_INFO("[ModifierSystem] Modifier ID {} expired on entity #{}.", settings->id, entity);
                }
            }
        }
    }

    float ModifierSystem::calculateModifiedValue(Registry &registry, EntityID entity, ModifierType type, float baseValue) const
    {
        auto *settings = registry.GetComponent<ModifierSettingsComponent>(entity);
        auto *runtime = registry.GetComponent<ModifierRuntimeComponent>(entity);

        if (!settings || !runtime || !runtime->active || settings->type != type) return baseValue;

        switch (settings->operation)
        {
        case ModifierOperation::Set:
        case ModifierOperation::Override:
            return settings->value;
        case ModifierOperation::Add:
            return baseValue + settings->value;
        case ModifierOperation::Multiply:
            return baseValue * settings->value;
        default:
            return baseValue;
        }
    }

    SubsystemProfilerMetrics ModifierSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.01;
        metrics.memoryUsageBytes = sizeof(ModifierRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
