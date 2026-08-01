#ifndef PLATFORM_ENGINE_GAMEPLAY_SCORE_SCORE_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_SCORE_SCORE_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct ScoreSettingsComponent
    {
        bool enableDistance{true};
        bool enableCollectibles{true};
        float multiplier{1.0f};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_SCORE_SCORE_SETTINGS_COMPONENT_HPP
