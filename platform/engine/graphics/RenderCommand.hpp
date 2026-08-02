#ifndef PLATFORM_ENGINE_GRAPHICS_RENDER_COMMAND_HPP
#define PLATFORM_ENGINE_GRAPHICS_RENDER_COMMAND_HPP

#include <glm/glm.hpp>
#include <string>
#include <utility>
#include <vector>

struct SDL_Renderer;

namespace platform
{
    class RenderCommand
    {
    public:
        virtual ~RenderCommand() = default;
        virtual void Execute(SDL_Renderer *renderer) = 0;
    };

    class ClearCommand : public RenderCommand
    {
    public:
        ClearCommand(float r, float g, float b, float a = 1.0f)
            : m_r(r), m_g(g), m_b(b), m_a(a) {}

        void Execute(SDL_Renderer *renderer) override;

    private:
        float m_r{0.098f}; // RGB(25,25,25) default
        float m_g{0.098f};
        float m_b{0.098f};
        float m_a{1.0f};
    };

    class DrawRectangleCommand : public RenderCommand
    {
    public:
        DrawRectangleCommand(const glm::vec2 &screenPos, const glm::vec2 &size, float rotation, const glm::vec4 &color)
            : m_screenPos(screenPos), m_size(size), m_rotation(rotation), m_color(color) {}

        void Execute(SDL_Renderer *renderer) override;

    private:
        void ExecuteRotated(SDL_Renderer *renderer);

        glm::vec2 m_screenPos{0.0f, 0.0f};
        glm::vec2 m_size{64.0f, 64.0f};
        float m_rotation{0.0f};
        glm::vec4 m_color{1.0f, 1.0f, 1.0f, 1.0f};
    };

    /// Unfilled rectangle outline, used for selection boxes, panel borders and gizmos.
    class DrawRectangleOutlineCommand : public RenderCommand
    {
    public:
        DrawRectangleOutlineCommand(const glm::vec2 &screenPos, const glm::vec2 &size, const glm::vec4 &color, float thickness = 1.0f)
            : m_screenPos(screenPos), m_size(size), m_color(color), m_thickness(thickness) {}

        void Execute(SDL_Renderer *renderer) override;

    private:
        glm::vec2 m_screenPos{0.0f, 0.0f};
        glm::vec2 m_size{64.0f, 64.0f};
        glm::vec4 m_color{1.0f, 1.0f, 1.0f, 1.0f};
        float m_thickness{1.0f};
    };

    /// Filled circle drawn as a triangle fan. `spokeRotation` draws a spoke marker so
    /// rolling wheels read as rotating.
    class DrawCircleCommand : public RenderCommand
    {
    public:
        DrawCircleCommand(const glm::vec2 &screenPos, float radius, const glm::vec4 &color, float spokeRotation = 0.0f)
            : m_screenPos(screenPos), m_radius(radius), m_color(color), m_spokeRotation(spokeRotation) {}

        void Execute(SDL_Renderer *renderer) override;

    private:
        glm::vec2 m_screenPos{0.0f, 0.0f};
        float m_radius{16.0f};
        glm::vec4 m_color{1.0f, 1.0f, 1.0f, 1.0f};
        float m_spokeRotation{0.0f};
    };

    /// Filled convex polygon in screen space. Points must be given in order; the
    /// command fans them from the first vertex.
    class DrawConvexPolygonCommand : public RenderCommand
    {
    public:
        DrawConvexPolygonCommand(std::vector<glm::vec2> points, const glm::vec4 &color)
            : m_points(std::move(points)), m_color(color) {}

        void Execute(SDL_Renderer *renderer) override;

    private:
        std::vector<glm::vec2> m_points;
        glm::vec4 m_color{1.0f, 1.0f, 1.0f, 1.0f};
    };

    /// Closed outline through the given points, one line per edge.
    class DrawPolylineCommand : public RenderCommand
    {
    public:
        DrawPolylineCommand(std::vector<glm::vec2> points, const glm::vec4 &color, bool closed = true)
            : m_points(std::move(points)), m_color(color), m_closed(closed) {}

        void Execute(SDL_Renderer *renderer) override;

    private:
        std::vector<glm::vec2> m_points;
        glm::vec4 m_color{1.0f, 1.0f, 1.0f, 1.0f};
        bool m_closed{true};
    };

    class DrawLineCommand : public RenderCommand
    {
    public:
        DrawLineCommand(const glm::vec2 &from, const glm::vec2 &to, const glm::vec4 &color)
            : m_from(from), m_to(to), m_color(color) {}

        void Execute(SDL_Renderer *renderer) override;

    private:
        glm::vec2 m_from{0.0f, 0.0f};
        glm::vec2 m_to{0.0f, 0.0f};
        glm::vec4 m_color{1.0f, 1.0f, 1.0f, 1.0f};
    };

    class DrawTextCommand : public RenderCommand
    {
    public:
        DrawTextCommand(const glm::vec2 &screenPos, std::string text, const glm::vec4 &color, float scale = 1.0f)
            : m_screenPos(screenPos), m_text(std::move(text)), m_color(color), m_scale(scale) {}

        /// Width in pixels of one glyph of the built-in debug font at the given scale.
        static constexpr float GlyphWidth(float scale = 1.0f) { return 8.0f * scale; }
        /// Height in pixels of one line of the built-in debug font at the given scale.
        static constexpr float GlyphHeight(float scale = 1.0f) { return 8.0f * scale; }

        void Execute(SDL_Renderer *renderer) override;

    private:
        glm::vec2 m_screenPos{0.0f, 0.0f};
        std::string m_text;
        glm::vec4 m_color{1.0f, 1.0f, 1.0f, 1.0f};
        float m_scale{1.0f};
    };

    /// Restricts (or restores) the drawable area. Used by the editor to keep the
    /// scene viewport from bleeding under the surrounding panels.
    class SetClipRectCommand : public RenderCommand
    {
    public:
        SetClipRectCommand() = default;
        SetClipRectCommand(const glm::vec2 &topLeft, const glm::vec2 &size)
            : m_topLeft(topLeft), m_size(size), m_enabled(true) {}

        void Execute(SDL_Renderer *renderer) override;

    private:
        glm::vec2 m_topLeft{0.0f, 0.0f};
        glm::vec2 m_size{0.0f, 0.0f};
        bool m_enabled{false};
    };

    class PresentCommand : public RenderCommand
    {
    public:
        void Execute(SDL_Renderer *renderer) override;
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_RENDER_COMMAND_HPP
