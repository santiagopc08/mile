#ifndef PLATFORM_ENGINE_SCENE_PREFAB_PREFAB_HPP
#define PLATFORM_ENGINE_SCENE_PREFAB_PREFAB_HPP

#include "engine/assets/AssetID.hpp"
#include <string>
#include <vector>
#include <glm/glm.hpp>

namespace platform
{
    struct PrefabEntityData
    {
        std::string Name{"Prefab Entity"};
        std::string Tag{"Default"};
        std::string Layer{"Default"};
        bool Enabled{true};

        glm::vec2 Position{0.0f, 0.0f};
        float Rotation{0.0f};
        glm::vec2 Scale{1.0f, 1.0f};

        bool HasSprite{false};
        std::string TexturePath;

        std::vector<PrefabEntityData> Children;
    };

    struct PrefabData
    {
        AssetID ID{kInvalidAssetID};
        std::string Name{"New Prefab"};
        PrefabEntityData RootEntity;
    };
}

#endif // PLATFORM_ENGINE_SCENE_PREFAB_PREFAB_HPP
