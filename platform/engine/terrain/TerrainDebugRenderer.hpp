#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_DEBUG_RENDERER_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_DEBUG_RENDERER_HPP

#include "engine/terrain/TerrainManager.hpp"
#include "engine/graphics/Renderer.hpp"
#include "engine/graphics/Camera2D.hpp"

namespace platform
{
    class TerrainDebugRenderer
    {
    public:
        TerrainDebugRenderer();

        void RenderDebug(const TerrainManager &terrainManager, Renderer &renderer, const Camera2D &camera);
        void ToggleDebug() { m_enabled = !m_enabled; }
        void SetEnabled(bool enabled) { m_enabled = enabled; }

        [[nodiscard]] bool IsEnabled() const { return m_enabled; }

    private:
        bool m_enabled{true};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_DEBUG_RENDERER_HPP
