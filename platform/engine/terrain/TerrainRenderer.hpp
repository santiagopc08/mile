#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_RENDERER_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_RENDERER_HPP

#include "engine/terrain/TerrainManager.hpp"
#include "engine/graphics/Renderer.hpp"
#include "engine/graphics/Camera2D.hpp"

namespace platform
{
    class TerrainRenderer
    {
    public:
        TerrainRenderer();

        void RenderTerrain(const TerrainManager &terrainManager, Renderer &renderer, const Camera2D &camera);

        [[nodiscard]] size_t GetRenderedChunkCount() const { return m_renderedChunks; }

    private:
        size_t m_renderedChunks{0};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_RENDERER_HPP
