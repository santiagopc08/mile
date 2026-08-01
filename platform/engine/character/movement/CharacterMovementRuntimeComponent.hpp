#ifndef PLATFORM_ENGINE_CHARACTER_MOVEMENT_CHARACTER_MOVEMENT_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_CHARACTER_MOVEMENT_CHARACTER_MOVEMENT_RUNTIME_COMPONENT_HPP

namespace platform
{
    enum class MovementMode
    {
        Idle,
        Walking,
        Running,
        Airborne
    };

    enum class MovementDirection
    {
        Left,
        Right
    };

    struct CharacterMovementRuntimeComponent
    {
        float desiredSpeed{0.0f};
        float currentSpeed{0.0f};
        MovementMode mode{MovementMode::Idle};
        MovementDirection direction{MovementDirection::Right};
        bool runningEnabled{false};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_MOVEMENT_CHARACTER_MOVEMENT_RUNTIME_COMPONENT_HPP
