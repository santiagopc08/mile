#ifndef PLATFORM_ENGINE_CHARACTER_CHARACTER_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_CHARACTER_CHARACTER_RUNTIME_COMPONENT_HPP

#include <glm/glm.hpp>
#include <string>

namespace platform
{
    enum class CharacterState
    {
        Spawned,
        Active,
        Disabled,
        Destroyed
    };

    struct CharacterRuntimeComponent
    {
        CharacterState state{CharacterState::Spawned};
        bool grounded{true};
        bool enabled{true};
        glm::vec2 velocity{0.0f, 0.0f};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_CHARACTER_RUNTIME_COMPONENT_HPP
