#ifndef PLATFORM_ENGINE_GAMEPLAY_RECOVERY_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_RECOVERY_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct RecoverySettingsComponent
    {
        float maxRollAngle{90.0f};   // Degrees (upside down)
        float maxIdleTime{3.0f};     // Seconds immobilized
        float minimumVelocity{5.0f}; // Speed threshold
        bool enabled{true};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_RECOVERY_SETTINGS_COMPONENT_HPP
