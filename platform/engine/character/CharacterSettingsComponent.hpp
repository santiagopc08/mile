#ifndef PLATFORM_ENGINE_CHARACTER_CHARACTER_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_CHARACTER_CHARACTER_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct CharacterSettingsComponent
    {
        float mass{70.0f};
        float width{0.8f};
        float height{1.8f};
        float gravityScale{1.0f};
        bool canRotate{false};
        bool enabled{true};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_CHARACTER_SETTINGS_COMPONENT_HPP
