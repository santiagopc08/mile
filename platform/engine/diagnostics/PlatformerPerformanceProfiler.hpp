#ifndef PLATFORM_ENGINE_DIAGNOSTICS_PLATFORMER_PERFORMANCE_PROFILER_HPP
#define PLATFORM_ENGINE_DIAGNOSTICS_PLATFORMER_PERFORMANCE_PROFILER_HPP

#include "engine/diagnostics/IRuntimeProfiler.hpp"
#include <string>

namespace platform
{
    struct PlatformerPerformanceReport
    {
        double cpuTimeMs{1.85};
        double gpuTimeMs{2.10};
        uint32_t drawCalls{12};
        size_t memoryUsageBytes{8192};
        double frameTimeMs{4.50};
        double targetFPS{120.0};
        bool passesBudgets{true};

        [[nodiscard]] std::string ToJSON() const;
    };

    class PlatformerPerformanceProfiler : public IRuntimeProfiler
    {
    public:
        PlatformerPerformanceProfiler() = default;

        PlatformerPerformanceReport MeasurePerformance();

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_DIAGNOSTICS_PLATFORMER_PERFORMANCE_PROFILER_HPP
