#ifndef PLATFORM_ENGINE_PHYSICS_PHYSICS_DEBUG_RENDERER_HPP
#define PLATFORM_ENGINE_PHYSICS_PHYSICS_DEBUG_RENDERER_HPP

#include "engine/physics/PhysicsWorld.hpp"
#include "engine/graphics/Renderer.hpp"
#include "engine/scene/Registry.hpp"

namespace platform
{
    class PhysicsDebugRenderer
    {
    public:
        PhysicsDebugRenderer();

        void RenderDebug(Registry &registry, Renderer &renderer, const Camera2D &camera, const PhysicsWorld &physicsWorld);
        void ToggleDebug() { m_enabled = !m_enabled; }
        void SetEnabled(bool enabled) { m_enabled = enabled; }

        [[nodiscard]] bool IsEnabled() const { return m_enabled; }

    private:
        bool m_enabled{true};
    };
}

#endif // PLATFORM_ENGINE_PHYSICS_PHYSICS_DEBUG_RENDERER_HPP
