#ifndef PLATFORM_ENGINE_UI_WIDGETS_LABEL_HPP
#define PLATFORM_ENGINE_UI_WIDGETS_LABEL_HPP

#include "engine/ui/widgets/Widget.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    class Label : public Widget
    {
    public:
        Label() : Widget("Label") {}
        explicit Label(std::string text) : Widget("Label"), m_text(std::move(text)) {}
        Label(std::string name, std::string text) : Widget(std::move(name)), m_text(std::move(text)) {}

        void SetText(std::string text) { m_text = std::move(text); }
        [[nodiscard]] const std::string &GetText() const { return m_text; }

        void SetTextColor(const glm::vec4 &color) { m_textColor = color; }
        [[nodiscard]] const glm::vec4 &GetTextColor() const { return m_textColor; }

        void SetFontSize(float size) { m_fontSize = size; }
        [[nodiscard]] float GetFontSize() const { return m_fontSize; }

    protected:
        void OnRender(Renderer &renderer) override
        {
            glm::vec2 absPos = GetAbsolutePosition();
            // Label visual representation
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                absPos,
                glm::vec2(m_size.x, std::min(m_size.y, m_fontSize)),
                0.0f,
                m_textColor
            ));
        }

    private:
        std::string m_text{"Label"};
        glm::vec4 m_textColor{1.0f, 1.0f, 1.0f, 1.0f};
        float m_fontSize{16.0f};
    };
}

#endif // PLATFORM_ENGINE_UI_WIDGETS_LABEL_HPP
