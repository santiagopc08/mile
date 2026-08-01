#ifndef PLATFORM_ENGINE_TRIGGER_TRIGGER_SYSTEM_HPP
#define PLATFORM_ENGINE_TRIGGER_TRIGGER_SYSTEM_HPP

#include "engine/trigger/TriggerSettingsComponent.hpp"
#include "engine/trigger/TriggerRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"

namespace platform
{
    class TriggerSystem : public IRuntimeProfiler
    {
    public:
        TriggerSystem() = default;

        void registerTrigger(Registry &registry, EntityID triggerEntity, uint32_t id, TriggerCondition condition, TriggerAction action);
        void unregisterTrigger(Registry &registry, EntityID triggerEntity);
        void activate(Registry &registry, EntityID triggerEntity);
        void deactivate(Registry &registry, EntityID triggerEntity);
        bool fire(Registry &registry, EntityID triggerEntity, uint64_t currentTick);
        void reset(Registry &registry, EntityID triggerEntity);

        [[nodiscard]] TriggerState triggerState(Registry &registry, EntityID triggerEntity) const;
        [[nodiscard]] uint32_t triggerCount(Registry &registry) const;
        [[nodiscard]] uint32_t executedTriggers(Registry &registry, EntityID triggerEntity) const;
        [[nodiscard]] uint64_t lastExecutionTick(Registry &registry, EntityID triggerEntity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_TRIGGER_TRIGGER_SYSTEM_HPP
