#ifndef PLATFORM_ENGINE_TRIGGER_TRIGGER_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_TRIGGER_TRIGGER_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    enum class TriggerState
    {
        Created,
        Ready,
        Waiting,
        Triggered,
        Executing,
        Completed,
        Destroyed
    };

    struct TriggerRuntimeComponent
    {
        TriggerState state{TriggerState::Ready};
        uint32_t executionCount{0};
        uint64_t lastExecutionTick{0};
    };
}

#endif // PLATFORM_ENGINE_TRIGGER_TRIGGER_RUNTIME_COMPONENT_HPP
