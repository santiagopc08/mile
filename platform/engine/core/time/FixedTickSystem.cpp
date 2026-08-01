#include "engine/core/time/FixedTickSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void FixedTickSystem::tick(Registry &registry, EntityID tickEntity, double dt, const std::function<void(uint64_t step)> &onSimulationStep)
    {
        auto *settings = registry.GetComponent<FixedTickSettingsComponent>(tickEntity);
        auto *runtime = registry.GetComponent<FixedTickRuntimeComponent>(tickEntity);

        if (!settings) settings = &registry.AddComponent<FixedTickSettingsComponent>(tickEntity);
        if (!runtime) runtime = &registry.AddComponent<FixedTickRuntimeComponent>(tickEntity);

        if (runtime->paused) return;

        double fixedDelta = 1.0 / static_cast<double>(settings->tickRate);
        runtime->accumulator += dt;

        uint32_t ticksExecuted = 0;
        runtime->catchingUp = false;

        const double kEpsilon = 1e-9;
        while (runtime->accumulator + kEpsilon >= fixedDelta)
        {
            if (ticksExecuted >= settings->maxCatchUpTicks)
            {
                runtime->catchingUp = true;
                runtime->catchUpCount++;
                runtime->accumulator = 0.0; // Drop accumulated delay to avoid spiral of death
                LOG_WARN("[FixedTickSystem] Max catch-up ticks reached ({}). Accumulator reset.", settings->maxCatchUpTicks);
                break;
            }

            runtime->simulationTick++;
            ticksExecuted++;
            runtime->accumulator -= fixedDelta;

            // Update deterministic FNV-1a hash
            uint64_t val = runtime->simulationTick;
            runtime->deterministicHash ^= val;
            runtime->deterministicHash *= 1099511628211ULL;

            if (onSimulationStep)
            {
                onSimulationStep(runtime->simulationTick);
            }
        }

        // Calculate interpolation alpha for rendering
        runtime->alpha = runtime->accumulator / fixedDelta;
    }

    void FixedTickSystem::reset(Registry &registry, EntityID tickEntity)
    {
        auto *runtime = registry.GetComponent<FixedTickRuntimeComponent>(tickEntity);
        if (runtime)
        {
            runtime->simulationTick = 0;
            runtime->accumulator = 0.0;
            runtime->alpha = 0.0;
            runtime->catchingUp = false;
            runtime->paused = false;
            runtime->catchUpCount = 0;
            runtime->deterministicHash = 14695981039346656037ULL;
            LOG_INFO("[FixedTickSystem] Reset simulation tick state on entity #{}.", tickEntity);
        }
    }

    void FixedTickSystem::pause(Registry &registry, EntityID tickEntity)
    {
        auto *runtime = registry.GetComponent<FixedTickRuntimeComponent>(tickEntity);
        if (runtime) runtime->paused = true;
    }

    void FixedTickSystem::resume(Registry &registry, EntityID tickEntity)
    {
        auto *runtime = registry.GetComponent<FixedTickRuntimeComponent>(tickEntity);
        if (runtime) runtime->paused = false;
    }

    uint64_t FixedTickSystem::simulationTick(Registry &registry, EntityID tickEntity) const
    {
        auto *runtime = registry.GetComponent<FixedTickRuntimeComponent>(tickEntity);
        return runtime ? runtime->simulationTick : 0;
    }

    double FixedTickSystem::alpha(Registry &registry, EntityID tickEntity) const
    {
        auto *runtime = registry.GetComponent<FixedTickRuntimeComponent>(tickEntity);
        return runtime ? runtime->alpha : 0.0;
    }

    uint32_t FixedTickSystem::tickRate(Registry &registry, EntityID tickEntity) const
    {
        auto *settings = registry.GetComponent<FixedTickSettingsComponent>(tickEntity);
        return settings ? settings->tickRate : 60;
    }

    double FixedTickSystem::simulationTime(Registry &registry, EntityID tickEntity) const
    {
        auto *runtime = registry.GetComponent<FixedTickRuntimeComponent>(tickEntity);
        auto *settings = registry.GetComponent<FixedTickSettingsComponent>(tickEntity);
        if (runtime && settings && settings->tickRate > 0)
        {
            return static_cast<double>(runtime->simulationTick) / static_cast<double>(settings->tickRate);
        }
        return 0.0;
    }

    double FixedTickSystem::renderAlpha(Registry &registry, EntityID tickEntity) const
    {
        return alpha(registry, tickEntity);
    }

    uint32_t FixedTickSystem::catchUpCount(Registry &registry, EntityID tickEntity) const
    {
        auto *runtime = registry.GetComponent<FixedTickRuntimeComponent>(tickEntity);
        return runtime ? runtime->catchUpCount : 0;
    }

    bool FixedTickSystem::isDeterministic(Registry &registry, EntityID tickEntity) const
    {
        auto *settings = registry.GetComponent<FixedTickSettingsComponent>(tickEntity);
        return settings ? settings->deterministic : true;
    }

    uint64_t FixedTickSystem::deterministicHash(Registry &registry, EntityID tickEntity) const
    {
        auto *runtime = registry.GetComponent<FixedTickRuntimeComponent>(tickEntity);
        return runtime ? runtime->deterministicHash : 14695981039346656037ULL;
    }

    SubsystemProfilerMetrics FixedTickSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Deterministic";
        metrics.cpuTimeMs = 0.02;
        metrics.memoryUsageBytes = sizeof(FixedTickRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
