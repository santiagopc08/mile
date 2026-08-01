#ifndef PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct FixedTickRuntimeComponent
    {
        uint64_t simulationTick{0};
        double accumulator{0.0};
        double alpha{0.0};
        bool catchingUp{false};
        bool paused{false};
        uint32_t catchUpCount{0};
        uint64_t deterministicHash{14695981039346656037ULL}; // FNV-1a hash seed
    };
}

#endif // PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_RUNTIME_COMPONENT_HPP
