#ifndef PLATFORM_ENGINE_UI_WIDGETS_BUTTON_HPP
#define PLATFORM_ENGINE_UI_WIDGETS_BUTTON_HPP

#include "engine/ui/widgets/Widget.hpp"
#include "engine/graphics/RenderCommand.hpp"
#include <functional>

namespace platform
{
    using ButtonCallbackFn = std::function<void()>;

    class Button : public Widget
    {
    public:
        Button() : Widget("Button") {}
        explicit Button(std::string name) : Widget(std::move(name)) {}

        void SetOnClick(ButtonCallbackFn callback) { m_onClick = std::move(callback); }
        void Click() { if (m_onClick && IsEnabled() && IsVisible()) m_onClick(); }

        void SetNormalColor(const glm::vec4 &color) { m_normalColor = color; }
        void SetHoverColor(const glm::vec4 &color) { m_hoverColor = color; }
        void SetPressedColor(const glm::vec4 &color) { m_pressedColor = color; }
        void SetDisabledColor(const glm::vec4 &color) { m_disabledColor = color; }

        void SetText(std::string text) { m_text = std::move(text); }
        [[nodiscard]] const std::string &GetText() const { return m_text; }

    protected:
        void OnRender(Renderer &renderer) override
        {
            glm::vec2 absPos = GetAbsolutePosition();
            glm::vec4 color = m_normalColor;

            if (!IsEnabled()) color = m_disabledColor;
            else if (m_state == WidgetState::Pressed) color = m_pressedColor;
            else if (m_state == WidgetState::Hovered) color = m_hoverColor;

            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                absPos,
                m_size,
                0.0f,
                color
            ));
        }

    private:
        ButtonCallbackFn m_onClick;
        std::string m_text{"Button"};

        glm::vec4 m_normalColor{0.25f, 0.35f, 0.55f, 0.9f};
        glm::vec4 m_hoverColor{0.35f, 0.45f, 0.7f, 1.0f};
        glm::vec4 m_pressedColor{0.15f, 0.25f, 0.4f, 1.0f};
        glm::vec4 m_disabledColor{0.2f, 0.2f, 0.2f, 0.5f};
    };
}

#endif // PLATFORM_ENGINE_UI_WIDGETS_BUTTON_HPP
