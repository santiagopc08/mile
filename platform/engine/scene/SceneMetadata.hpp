#ifndef PLATFORM_ENGINE_SCENE_SCENE_METADATA_HPP
#define PLATFORM_ENGINE_SCENE_SCENE_METADATA_HPP

#include <string>

namespace platform
{
    struct SceneMetadata
    {
        std::string Name{"Default Scene"};
        std::string UUID{"00000000-0000-0000-0000-000000000000"};
        std::string Version{"1.0.0"};
        std::string Author{"Platform Developer"};
        std::string CreationDate{"2026-07-29"};
    };
}

#endif // PLATFORM_ENGINE_SCENE_SCENE_METADATA_HPP
