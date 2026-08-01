#ifndef PLATFORM_ENGINE_DIAGNOSTICS_GAME_PROFILER_HPP
#define PLATFORM_ENGINE_DIAGNOSTICS_GAME_PROFILER_HPP

#include "engine/diagnostics/IRuntimeProfiler.hpp"

namespace platform
{
    class GameProfiler : public IRuntimeProfiler
    {
    public:
        GameProfiler() = default;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
        [[nodiscard]] bool ValidatePerformanceBudgets() const;
    };
}

#endif // PLATFORM_ENGINE_DIAGNOSTICS_GAME_PROFILER_HPP
