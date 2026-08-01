#ifndef PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct JumpSettingsComponent
    {
        float jumpHeight{3.0f};
        float jumpForce{12.0f};
        float gravityScaleUp{1.0f};
        float gravityScaleDown{2.0f};
        float coyoteTime{0.15f};
        float jumpBuffer{0.10f};
        bool variableJumpHeight{true};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_SETTINGS_COMPONENT_HPP
