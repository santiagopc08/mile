#ifndef PLATFORM_ENGINE_CHARACTER_MOVEMENT_CHARACTER_MOVEMENT_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_CHARACTER_MOVEMENT_CHARACTER_MOVEMENT_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct CharacterMovementSettingsComponent
    {
        float maxWalkSpeed{5.0f};
        float maxRunSpeed{9.0f};
        float acceleration{20.0f};
        float deceleration{25.0f};
        float airAcceleration{10.0f};
        float airDeceleration{12.0f};
        float turnAcceleration{35.0f};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_MOVEMENT_CHARACTER_MOVEMENT_SETTINGS_COMPONENT_HPP
