#ifndef PLATFORM_ENGINE_GRAPHICS_RENDERER_HPP
#define PLATFORM_ENGINE_GRAPHICS_RENDERER_HPP

#include "engine/platform/IWindow.hpp"
#include "engine/graphics/RenderContext.hpp"
#include "engine/graphics/RenderCommandQueue.hpp"
#include "engine/graphics/Camera2D.hpp"
#include <memory>
#include <string>

struct SDL_Renderer;

namespace platform
{
    class Renderer
    {
    public:
        Renderer();
        ~Renderer();

        bool Initialize(IWindow *window);
        void Shutdown();

        /// Keep the logical drawing surface aligned with the window size so drawing
        /// coordinates stay in window points on HiDPI displays.
        void SetLogicalSize(int width, int height);

        void BeginFrame();
        void Clear();
        void Clear(float r, float g, float b, float a = 1.0f);
        void SubmitCommand(std::unique_ptr<RenderCommand> command);
        void ExecuteCommands();
        void Present();

        /// Writes the current backbuffer to a BMP file. Used for headless smoke tests.
        bool SaveScreenshot(const std::string &filePath) const;

        void SetClearColor(const glm::vec4 &color) { m_context.ClearColor = color; }
        [[nodiscard]] const glm::vec4 &GetClearColor() const { return m_context.ClearColor; }

        [[nodiscard]] Camera2D &GetCamera() { return m_camera; }
        [[nodiscard]] const Camera2D &GetCamera() const { return m_camera; }
        [[nodiscard]] const RenderContext &GetContext() const { return m_context; }
        [[nodiscard]] SDL_Renderer *GetNativeRenderer() const { return m_renderer; }

    private:
        SDL_Renderer *m_renderer{nullptr};
        RenderContext m_context{};
        RenderCommandQueue m_commandQueue{};
        Camera2D m_camera{};
        bool m_initialized{false};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_RENDERER_HPP
