#ifndef PLATFORM_ENGINE_UI_WIDGETS_IMAGE_WIDGET_HPP
#define PLATFORM_ENGINE_UI_WIDGETS_IMAGE_WIDGET_HPP

#include "engine/ui/widgets/Widget.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    class ImageWidget : public Widget
    {
    public:
        ImageWidget() : Widget("ImageWidget") {}
        explicit ImageWidget(std::string name) : Widget(std::move(name)) {}

        void SetTintColor(const glm::vec4 &color) { m_tintColor = color; }
        [[nodiscard]] const glm::vec4 &GetTintColor() const { return m_tintColor; }

        void SetTextureHandle(uint64_t handle) { m_textureHandle = handle; }
        [[nodiscard]] uint64_t GetTextureHandle() const { return m_textureHandle; }

    protected:
        void OnRender(Renderer &renderer) override
        {
            glm::vec2 absPos = GetAbsolutePosition();
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                absPos,
                m_size,
                0.0f,
                m_tintColor
            ));
        }

    private:
        uint64_t m_textureHandle{0};
        glm::vec4 m_tintColor{1.0f, 1.0f, 1.0f, 1.0f};
    };
}

#endif // PLATFORM_ENGINE_UI_WIDGETS_IMAGE_WIDGET_HPP
