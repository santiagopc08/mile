#ifndef PLATFORM_ENGINE_SCENE_PREFAB_PREFAB_LOADER_HPP
#define PLATFORM_ENGINE_SCENE_PREFAB_PREFAB_LOADER_HPP

#include "engine/scene/prefab/Prefab.hpp"
#include "engine/scene/Scene.hpp"
#include <string>

namespace platform
{
    class PrefabLoader
    {
    public:
        PrefabLoader() = default;

        PrefabData loadPrefab(const std::string &path);
        EntityID instantiatePrefab(Scene &scene, const PrefabData &prefab, const glm::vec2 &position = {0.0f, 0.0f});
        void destroyPrefab(Scene &scene, EntityID prefabRoot);
    };
}

#endif // PLATFORM_ENGINE_SCENE_PREFAB_PREFAB_LOADER_HPP
