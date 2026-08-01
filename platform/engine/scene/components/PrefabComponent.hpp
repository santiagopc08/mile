#ifndef PLATFORM_ENGINE_SCENE_COMPONENTS_PREFAB_COMPONENT_HPP
#define PLATFORM_ENGINE_SCENE_COMPONENTS_PREFAB_COMPONENT_HPP

#include "engine/assets/AssetID.hpp"

namespace platform
{
    struct PrefabComponent
    {
        AssetID PrefabID{kInvalidAssetID};
        bool IsOverridden{false};
    };
}

#endif // PLATFORM_ENGINE_SCENE_COMPONENTS_PREFAB_COMPONENT_HPP
