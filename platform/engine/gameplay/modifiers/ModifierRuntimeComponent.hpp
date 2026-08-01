#ifndef PLATFORM_ENGINE_GAMEPLAY_MODIFIERS_MODIFIER_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_MODIFIERS_MODIFIER_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct ModifierRuntimeComponent
    {
        bool active{true};
        double remainingTime{0.0};
        float appliedValue{1.0f};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_MODIFIERS_MODIFIER_RUNTIME_COMPONENT_HPP
