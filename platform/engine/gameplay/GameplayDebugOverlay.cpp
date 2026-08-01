#include "engine/gameplay/GameplayDebugOverlay.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    GameplayDebugOverlay::GameplayDebugOverlay() = default;

    void GameplayDebugOverlay::RenderOverlay(const GameplayStateMachine &stateMachine, Renderer &renderer, const Camera2D &camera)
    {
        if (!m_enabled)
        {
            return;
        }

        (void)stateMachine;
        (void)camera;

        // Render top-left UI status bar backing (dark semi-transparent overlay)
        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            glm::vec2(160.0f, 40.0f),
            glm::vec2(280.0f, 60.0f),
            0.0f,
            glm::vec4(0.05f, 0.05f, 0.08f, 0.85f)
        ));
    }
}
