#ifndef PLATFORM_ENGINE_LEVEL_LEVEL_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_LEVEL_SETTINGS_COMPONENT_HPP

#include <string>

namespace platform
{
    using LevelID = uint32_t;

    struct LevelSettingsComponent
    {
        LevelID levelID{1};
        std::string name{"Level 1-1"};
        bool streamable{true};
        std::string musicTrack{"music_world1.ogg"};
        std::string backgroundAsset{"bg_hills.png"};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_LEVEL_SETTINGS_COMPONENT_HPP
