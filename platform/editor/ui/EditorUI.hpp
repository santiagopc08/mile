#ifndef PLATFORM_EDITOR_UI_EDITOR_UI_HPP
#define PLATFORM_EDITOR_UI_EDITOR_UI_HPP

#include "editor/ui/EditorTheme.hpp"

#include <glm/glm.hpp>
#include <string>

namespace platform
{
    class Renderer;
    class Input;

    /// Axis-aligned rectangle in window points, top-left origin.
    struct UIRect
    {
        float X{0.0f};
        float Y{0.0f};
        float Width{0.0f};
        float Height{0.0f};

        [[nodiscard]] float Right() const { return X + Width; }
        [[nodiscard]] float Bottom() const { return Y + Height; }
        [[nodiscard]] glm::vec2 Center() const { return {X + Width * 0.5f, Y + Height * 0.5f}; }
        [[nodiscard]] glm::vec2 Size() const { return {Width, Height}; }

        [[nodiscard]] bool Contains(const glm::vec2 &point) const
        {
            return point.x >= X && point.x <= Right() && point.y >= Y && point.y <= Bottom();
        }

        [[nodiscard]] UIRect Inset(float amount) const
        {
            return {X + amount, Y + amount, Width - amount * 2.0f, Height - amount * 2.0f};
        }
    };

    /// Immediate-mode drawing and hit-testing on top of the render command queue.
    ///
    /// Panels call into this to paint themselves and to ask whether the user clicked
    /// them. Widgets are evaluated in submission order, and the first widget to claim
    /// a click consumes it, so panels drawn later never steal input from the chrome
    /// drawn above them.
    class EditorUI
    {
    public:
        void BeginFrame(Renderer *renderer, Input *input, float viewportWidth, float viewportHeight);
        void EndFrame();

        // --- Drawing -------------------------------------------------------
        void Rect(const UIRect &rect, const glm::vec4 &color);
        void RectOutline(const UIRect &rect, const glm::vec4 &color, float thickness = 1.0f);
        void Circle(const glm::vec2 &center, float radius, const glm::vec4 &color);
        void Line(const glm::vec2 &from, const glm::vec2 &to, const glm::vec4 &color);
        void Text(float x, float y, const std::string &text, const glm::vec4 &color, float scale = EditorTheme::TextScale);
        void TextClipped(const UIRect &bounds, float x, float y, const std::string &text, const glm::vec4 &color,
                         float scale = EditorTheme::TextScale);

        /// Panel chrome: background, border and a title strip. Returns the content area.
        UIRect Panel(const UIRect &bounds, const std::string &title);

        /// Restrict drawing to `rect` until ClearClip() is submitted.
        void PushClip(const UIRect &rect);
        void ClearClip();

        // --- Widgets -------------------------------------------------------
        bool Button(const UIRect &rect, const std::string &label, bool enabled = true, bool active = false);
        /// Selectable row used by list panels. Returns true on click.
        bool Row(const UIRect &rect, const std::string &label, bool selected);
        /// Consumes a left click inside the rect without drawing anything.
        bool ClickArea(const UIRect &rect);

        // --- Input queries -------------------------------------------------
        [[nodiscard]] const glm::vec2 &MousePosition() const { return m_mouse; }
        [[nodiscard]] bool IsHovered(const UIRect &rect) const { return rect.Contains(m_mouse); }
        [[nodiscard]] bool MousePressed() const { return m_mousePressed; }
        [[nodiscard]] bool MouseHeld() const { return m_mouseHeld; }
        [[nodiscard]] bool MouseReleased() const { return m_mouseReleased; }
        [[nodiscard]] bool ClickAvailable() const { return m_mousePressed && !m_clickConsumed; }
        void ConsumeClick() { m_clickConsumed = true; }
        [[nodiscard]] float ScrollDelta() const { return m_scrollY; }

        [[nodiscard]] float ViewportWidth() const { return m_viewportWidth; }
        [[nodiscard]] float ViewportHeight() const { return m_viewportHeight; }

        [[nodiscard]] static float TextWidth(const std::string &text, float scale = EditorTheme::TextScale);

    private:
        Renderer *m_renderer{nullptr};
        glm::vec2 m_mouse{0.0f, 0.0f};
        bool m_mousePressed{false};
        bool m_mouseHeld{false};
        bool m_mouseReleased{false};
        bool m_clickConsumed{false};
        float m_scrollY{0.0f};
        float m_viewportWidth{1600.0f};
        float m_viewportHeight{900.0f};
    };
}

#endif // PLATFORM_EDITOR_UI_EDITOR_UI_HPP
