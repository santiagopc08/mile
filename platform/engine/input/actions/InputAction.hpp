#ifndef PLATFORM_ENGINE_INPUT_ACTIONS_INPUT_ACTION_HPP
#define PLATFORM_ENGINE_INPUT_ACTIONS_INPUT_ACTION_HPP

#include <cstdint>

namespace platform
{
    enum class InputAction : uint8_t
    {
        None = 0,
        MoveLeft,
        MoveRight,
        MoveUp,
        MoveDown,
        Accept,
        Cancel,
        Pause
    };

    enum class ActionState : uint8_t
    {
        Started = 0,
        Triggered,
        Held,
        Released
    };
}

#endif // PLATFORM_ENGINE_INPUT_ACTIONS_INPUT_ACTION_HPP
