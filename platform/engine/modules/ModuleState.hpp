#ifndef PLATFORM_ENGINE_MODULES_MODULE_STATE_HPP
#define PLATFORM_ENGINE_MODULES_MODULE_STATE_HPP

#include <cstdint>

namespace platform
{
    enum class ModuleState : uint8_t
    {
        Created = 0,
        Configured,
        Initialized,
        Running,
        Stopping,
        Stopped,
        Destroyed
    };
}

#endif // PLATFORM_ENGINE_MODULES_MODULE_STATE_HPP
