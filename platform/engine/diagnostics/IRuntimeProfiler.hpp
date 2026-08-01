#ifndef PLATFORM_ENGINE_DIAGNOSTICS_I_RUNTIME_PROFILER_HPP
#define PLATFORM_ENGINE_DIAGNOSTICS_I_RUNTIME_PROFILER_HPP

#include <cstdint>
#include <string>

namespace platform
{
    struct SubsystemProfilerMetrics
    {
        std::string currentState{"Active"};
        double cpuTimeMs{0.0};
        size_t memoryUsageBytes{0};
        size_t peakMemoryBytes{0};
        uint32_t activeObjects{0};
        uint64_t lifetimeObjectsCreated{0};
    };

    class IRuntimeProfiler
    {
    public:
        virtual ~IRuntimeProfiler() = default;

        [[nodiscard]] virtual SubsystemProfilerMetrics GetProfilerMetrics() const = 0;
    };
}

#endif // PLATFORM_ENGINE_DIAGNOSTICS_I_RUNTIME_PROFILER_HPP
