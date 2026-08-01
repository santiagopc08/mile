#ifndef PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_RUNTIME_COMPONENT_HPP

namespace platform
{
    enum class JumpState
    {
        Ready,
        Buffered,
        Jumping,
        Ascending,
        Falling,
        Landing
    };

    struct JumpRuntimeComponent
    {
        bool jumping{false};
        bool bufferedJump{false};
        double jumpStartTime{0.0};
        double lastGroundTime{0.0};
        float jumpProgress{0.0f};
        float bufferTimer{0.0f};
        float coyoteTimer{0.0f};
        JumpState state{JumpState::Ready};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_RUNTIME_COMPONENT_HPP
