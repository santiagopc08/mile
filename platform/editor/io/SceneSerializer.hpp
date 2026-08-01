#ifndef PLATFORM_EDITOR_IO_SCENE_SERIALIZER_HPP
#define PLATFORM_EDITOR_IO_SCENE_SERIALIZER_HPP

#include "engine/scene/Scene.hpp"
#include <string>

namespace platform
{
    /// Plain-text scene persistence for the standalone editor.
    ///
    /// The format is intentionally line based and dependency free: one `ENTITY`
    /// block per entity, one component per line, terminated by `END`.
    class SceneSerializer
    {
    public:
        static bool Save(Scene &scene, const std::string &filePath, std::string &outError);

        /// Replaces every entity in `scene` with the file contents.
        static bool Load(Scene &scene, const std::string &filePath, std::string &outError);
    };
}

#endif // PLATFORM_EDITOR_IO_SCENE_SERIALIZER_HPP
