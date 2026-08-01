#ifndef PLATFORM_ENGINE_AI_AI_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_AI_AI_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct AISettingsComponent
    {
        float visionRange{12.0f};
        float hearingRange{6.0f};
        float reactionTime{0.15f};
    };
}

#endif // PLATFORM_ENGINE_AI_AI_SETTINGS_COMPONENT_HPP
