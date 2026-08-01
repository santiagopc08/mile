#include "engine/terrain/TerrainRenderer.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    TerrainRenderer::TerrainRenderer() = default;

    void TerrainRenderer::RenderTerrain(const TerrainManager &terrainManager, Renderer &renderer, const Camera2D &camera)
    {
        m_renderedChunks = 0;

        glm::vec2 camPos = camera.GetPosition();
        float zoom = camera.GetZoom();
        float halfW = camera.GetViewportWidth() * 0.5f;
        float halfH = camera.GetViewportHeight() * 0.5f;

        glm::vec4 terrainColor(0.2f, 0.7f, 0.3f, 1.0f); // Green surface

        for (const auto &[idx, chunk] : terrainManager.GetChunks())
        {
            if (!chunk)
            {
                continue;
            }

            const auto &points = chunk->GetSurfacePoints();
            if (points.size() < 2)
            {
                continue;
            }

            m_renderedChunks++;

            for (size_t i = 0; i < points.size() - 1; ++i)
            {
                glm::vec2 p1 = points[i];
                glm::vec2 p2 = points[i + 1];

                glm::vec2 s1;
                s1.x = (p1.x - camPos.x) * zoom + halfW;
                s1.y = (p1.y - camPos.y) * zoom + halfH;

                glm::vec2 s2;
                s2.x = (p2.x - camPos.x) * zoom + halfW;
                s2.y = (p2.y - camPos.y) * zoom + halfH;

                glm::vec2 segmentCenter = (s1 + s2) * 0.5f;
                glm::vec2 segmentSize(std::abs(s2.x - s1.x) + 2.0f, 120.0f);

                // Render terrain surface segment block
                renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                    segmentCenter,
                    segmentSize,
                    0.0f,
                    terrainColor
                ));
            }
        }
    }
}
