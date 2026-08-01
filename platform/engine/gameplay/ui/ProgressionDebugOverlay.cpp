#include "engine/gameplay/ui/ProgressionDebugOverlay.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    ProgressionDebugOverlay::ProgressionDebugOverlay() = default;

    void ProgressionDebugOverlay::RenderOverlay(const FuelComponent &fuel, const ScoreSystem &scoreSystem, Renderer &renderer, const Camera2D &camera)
    {
        if (!m_enabled)
        {
            return;
        }

        (void)scoreSystem;
        (void)camera;

        // Render top HUD Fuel bar backing
        float fuelPct = fuel.CurrentFuel / fuel.MaximumFuel;
        glm::vec4 barColor = (fuelPct > 0.2f) ? glm::vec4(0.2f, 0.85f, 0.3f, 1.0f) : glm::vec4(0.9f, 0.2f, 0.2f, 1.0f);

        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            glm::vec2(120.0f, 20.0f),
            glm::vec2(200.0f * fuelPct, 16.0f),
            0.0f,
            barColor
        ));
    }
}
