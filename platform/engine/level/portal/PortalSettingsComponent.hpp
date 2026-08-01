#ifndef PLATFORM_ENGINE_LEVEL_PORTAL_PORTAL_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_PORTAL_PORTAL_SETTINGS_COMPONENT_HPP

#include "engine/level/LevelSettingsComponent.hpp"

namespace platform
{
    using SpawnPointID = uint32_t;

    enum class TransitionType
    {
        Instant,
        FadeToBlack,
        Slide
    };

    struct PortalSettingsComponent
    {
        LevelID destinationLevel{2};
        SpawnPointID spawnPoint{1};
        TransitionType transition{TransitionType::FadeToBlack};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_PORTAL_PORTAL_SETTINGS_COMPONENT_HPP
