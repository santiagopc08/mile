#ifndef PLATFORM_ENGINE_SCENE_SYSTEMS_TRANSFORM_SYSTEM_HPP
#define PLATFORM_ENGINE_SCENE_SYSTEMS_TRANSFORM_SYSTEM_HPP

#include "engine/scene/Registry.hpp"

namespace platform
{
    class TransformSystem
    {
    public:
        TransformSystem();

        void Update(Registry &registry, double dt);
        void PrepareRenderTransforms(Registry &registry);

        [[nodiscard]] size_t GetUpdatedTransformCount() const { return m_updatedCount; }

    private:
        size_t m_updatedCount{0};
    };
}

#endif // PLATFORM_ENGINE_SCENE_SYSTEMS_TRANSFORM_SYSTEM_HPP
