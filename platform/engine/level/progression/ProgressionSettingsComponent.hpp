#ifndef PLATFORM_ENGINE_LEVEL_PROGRESSION_PROGRESSION_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_PROGRESSION_PROGRESSION_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct ProgressionSettingsComponent
    {
        bool persistent{true};
        bool unlockNextLevel{true};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_PROGRESSION_PROGRESSION_SETTINGS_COMPONENT_HPP
