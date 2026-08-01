#ifndef PLATFORM_ENGINE_UI_WIDGETS_PANEL_HPP
#define PLATFORM_ENGINE_UI_WIDGETS_PANEL_HPP

#include "engine/ui/widgets/Widget.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    class Panel : public Widget
    {
    public:
        Panel() : Widget("Panel") {}
        explicit Panel(std::string name) : Widget(std::move(name)) {}

        void SetBackgroundColor(const glm::vec4 &color) { m_backgroundColor = color; }
        [[nodiscard]] const glm::vec4 &GetBackgroundColor() const { return m_backgroundColor; }

        void SetBorderColor(const glm::vec4 &color) { m_borderColor = color; }
        [[nodiscard]] const glm::vec4 &GetBorderColor() const { return m_borderColor; }

        void SetBorderWidth(float width) { m_borderWidth = width; }
        [[nodiscard]] float GetBorderWidth() const { return m_borderWidth; }

    protected:
        void OnRender(Renderer &renderer) override
        {
            glm::vec2 absPos = GetAbsolutePosition();

            // Render background panel rectangle
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                absPos,
                m_size,
                0.0f,
                m_backgroundColor
            ));
        }

    private:
        glm::vec4 m_backgroundColor{0.12f, 0.12f, 0.15f, 0.85f};
        glm::vec4 m_borderColor{0.3f, 0.3f, 0.35f, 1.0f};
        float m_borderWidth{1.0f};
    };
}

#endif // PLATFORM_ENGINE_UI_WIDGETS_PANEL_HPP
