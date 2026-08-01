#ifndef PLATFORM_ENGINE_SCENE_COMPONENTS_HPP
#define PLATFORM_ENGINE_SCENE_COMPONENTS_HPP

#include <glm/glm.hpp>
#include <string>

namespace platform
{
    /// TransformComponent: Position, Rotation, Scale, and Dirty state
    struct TransformComponent
    {
        glm::vec2 Position{0.0f, 0.0f};
        float Rotation{0.0f}; // Degrees
        glm::vec2 Scale{1.0f, 1.0f};
        bool IsDirty{true};

        void SetPosition(const glm::vec2 &pos)
        {
            if (Position != pos)
            {
                Position = pos;
                IsDirty = true;
            }
        }

        void SetRotation(float rot)
        {
            if (Rotation != rot)
            {
                Rotation = rot;
                IsDirty = true;
            }
        }

        void SetScale(const glm::vec2 &scale)
        {
            if (Scale != scale)
            {
                Scale = scale;
                IsDirty = true;
            }
        }

        void MarkClean() { IsDirty = false; }
        void MarkDirty() { IsDirty = true; }
    };

    /// NameComponent: Identifier for human diagnostics
    struct NameComponent
    {
        std::string Name{"Entity"};
    };

    /// TagComponent: Classification tag & layer name
    struct TagComponent
    {
        std::string Tag{"Default"};
        std::string Layer{"Default"};
    };

    /// ActiveComponent: Enablement and visibility flags
    struct ActiveComponent
    {
        bool Enabled{true};
        bool Visible{true};
    };
}

#endif // PLATFORM_ENGINE_SCENE_COMPONENTS_HPP
