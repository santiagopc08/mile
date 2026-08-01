#include "engine/audio/debug/AudioDebugOverlay.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    AudioDebugOverlay::AudioDebugOverlay() = default;

    void AudioDebugOverlay::RenderOverlay(const AudioDiagnostics &diagnostics, const AudioBusSystem &busSystem, const MusicSystem &musicSystem, Renderer &renderer)
    {
        if (!m_enabled)
        {
            return;
        }

        (void)diagnostics;
        (void)busSystem;
        (void)musicSystem;

        // Render Audio Debug panel at top-right
        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            glm::vec2(980.0f, 20.0f),
            glm::vec2(280.0f, 200.0f),
            0.0f,
            glm::vec4(0.08f, 0.08f, 0.12f, 0.85f)
        ));

        // Cyan indicator accent
        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            glm::vec2(980.0f, 20.0f),
            glm::vec2(4.0f, 200.0f),
            0.0f,
            glm::vec4(0.2f, 0.8f, 0.95f, 1.0f)
        ));
    }
}
