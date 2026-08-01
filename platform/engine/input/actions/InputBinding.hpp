#ifndef PLATFORM_ENGINE_INPUT_ACTIONS_INPUT_BINDING_HPP
#define PLATFORM_ENGINE_INPUT_ACTIONS_INPUT_BINDING_HPP

#include "engine/input/KeyCodes.hpp"
#include "engine/input/actions/InputAction.hpp"

namespace platform
{
    struct InputBinding
    {
        Key PrimaryKey{Key::Unknown};
        Key SecondaryKey{Key::Unknown};
        InputAction Action{InputAction::None};
    };
}

#endif // PLATFORM_ENGINE_INPUT_ACTIONS_INPUT_BINDING_HPP
