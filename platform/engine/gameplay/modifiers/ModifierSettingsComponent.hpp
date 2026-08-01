#ifndef PLATFORM_ENGINE_GAMEPLAY_MODIFIERS_MODIFIER_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_MODIFIERS_MODIFIER_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    enum class ModifierType
    {
        Gravity,
        MovementSpeed,
        JumpHeight,
        TimeScale,
        PlayerScale,
        CameraZoom,
        PhysicsMaterial,
        Custom
    };

    enum class ModifierOperation
    {
        Set,
        Add,
        Multiply,
        Override
    };

    struct ModifierSettingsComponent
    {
        uint32_t id{0};
        ModifierType type{ModifierType::Gravity};
        float value{1.0f};
        ModifierOperation operation{ModifierOperation::Multiply};
        float duration{0.0f}; // 0.0 = permanent
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_MODIFIERS_MODIFIER_SETTINGS_COMPONENT_HPP
