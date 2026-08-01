#ifndef PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_SYSTEM_HPP
#define PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_SYSTEM_HPP

#include "engine/core/time/FixedTickSettingsComponent.hpp"
#include "engine/core/time/FixedTickRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"
#include <functional>

namespace platform
{
    class FixedTickSystem : public IRuntimeProfiler
    {
    public:
        FixedTickSystem() = default;

        void tick(Registry &registry, EntityID tickEntity, double dt, const std::function<void(uint64_t step)> &onSimulationStep);
        void reset(Registry &registry, EntityID tickEntity);
        void pause(Registry &registry, EntityID tickEntity);
        void resume(Registry &registry, EntityID tickEntity);

        [[nodiscard]] uint64_t simulationTick(Registry &registry, EntityID tickEntity) const;
        [[nodiscard]] double alpha(Registry &registry, EntityID tickEntity) const;

        [[nodiscard]] uint32_t tickRate(Registry &registry, EntityID tickEntity) const;
        [[nodiscard]] double simulationTime(Registry &registry, EntityID tickEntity) const;
        [[nodiscard]] double renderAlpha(Registry &registry, EntityID tickEntity) const;
        [[nodiscard]] uint32_t catchUpCount(Registry &registry, EntityID tickEntity) const;
        [[nodiscard]] bool isDeterministic(Registry &registry, EntityID tickEntity) const;
        [[nodiscard]] uint64_t deterministicHash(Registry &registry, EntityID tickEntity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_SYSTEM_HPP
