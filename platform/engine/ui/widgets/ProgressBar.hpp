#ifndef PLATFORM_ENGINE_UI_WIDGETS_PROGRESS_BAR_HPP
#define PLATFORM_ENGINE_UI_WIDGETS_PROGRESS_BAR_HPP

#include "engine/ui/widgets/Widget.hpp"
#include "engine/graphics/RenderCommand.hpp"
#include <algorithm>

namespace platform
{
    class ProgressBar : public Widget
    {
    public:
        ProgressBar() : Widget("ProgressBar") {}
        explicit ProgressBar(std::string name) : Widget(std::move(name)) {}

        void SetProgress(float progress) { m_progress = std::clamp(progress, 0.0f, 1.0f); }
        [[nodiscard]] float GetProgress() const { return m_progress; }

        void SetFillColor(const glm::vec4 &color) { m_fillColor = color; }
        [[nodiscard]] const glm::vec4 &GetFillColor() const { return m_fillColor; }

        void SetBackgroundColor(const glm::vec4 &color) { m_backgroundColor = color; }
        [[nodiscard]] const glm::vec4 &GetBackgroundColor() const { return m_backgroundColor; }

    protected:
        void OnRender(Renderer &renderer) override
        {
            glm::vec2 absPos = GetAbsolutePosition();

            // Background bar
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                absPos,
                m_size,
                0.0f,
                m_backgroundColor
            ));

            // Fill bar
            if (m_progress > 0.001f)
            {
                glm::vec2 fillSize(m_size.x * m_progress, m_size.y);
                renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                    absPos,
                    fillSize,
                    0.0f,
                    m_fillColor
                ));
            }
        }

    private:
        float m_progress{1.0f};
        glm::vec4 m_fillColor{0.2f, 0.8f, 0.3f, 1.0f};
        glm::vec4 m_backgroundColor{0.15f, 0.15f, 0.18f, 0.9f};
    };
}

#endif // PLATFORM_ENGINE_UI_WIDGETS_PROGRESS_BAR_HPP
