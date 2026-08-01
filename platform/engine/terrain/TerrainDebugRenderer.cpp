#include "engine/terrain/TerrainDebugRenderer.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    TerrainDebugRenderer::TerrainDebugRenderer() = default;

    void TerrainDebugRenderer::RenderDebug(const TerrainManager &terrainManager, Renderer &renderer, const Camera2D &camera)
    {
        if (!m_enabled)
        {
            return;
        }

        glm::vec2 camPos = camera.GetPosition();
        float zoom = camera.GetZoom();
        float halfW = camera.GetViewportWidth() * 0.5f;
        float halfH = camera.GetViewportHeight() * 0.5f;

        glm::vec4 chunkBoundColor(0.9f, 0.2f, 0.2f, 0.7f); // Red chunk boundaries

        for (const auto &[idx, chunk] : terrainManager.GetChunks())
        {
            if (!chunk)
            {
                continue;
            }

            float startX = chunk->GetStartX();
            float endX = chunk->GetEndX();

            glm::vec2 sStart, sEnd;
            sStart.x = (startX - camPos.x) * zoom + halfW;
            sStart.y = (200.0f - camPos.y) * zoom + halfH;
            sEnd.x = (endX - camPos.x) * zoom + halfW;
            sEnd.y = (200.0f - camPos.y) * zoom + halfH;

            // Render Chunk Start boundary line indicator
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                sStart,
                glm::vec2(4.0f, 150.0f) * zoom,
                0.0f,
                chunkBoundColor
            ));
        }
    }
}
