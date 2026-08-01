#include "editor/ui/EditorUI.hpp"

#include "engine/graphics/RenderCommand.hpp"
#include "engine/graphics/Renderer.hpp"
#include "engine/input/Input.hpp"

#include <algorithm>
#include <memory>

namespace platform
{
    void EditorUI::BeginFrame(Renderer *renderer, Input *input, float viewportWidth, float viewportHeight)
    {
        m_renderer = renderer;
        m_viewportWidth = viewportWidth;
        m_viewportHeight = viewportHeight;
        m_clickConsumed = false;

        if (input)
        {
            input->GetMousePosition(m_mouse.x, m_mouse.y);
            m_mousePressed = input->IsMouseButtonPressed(MouseButton::Left);
            m_mouseHeld = input->IsMouseButtonHeld(MouseButton::Left) || m_mousePressed;
            m_mouseReleased = input->IsMouseButtonReleased(MouseButton::Left);

            float scrollX = 0.0f;
            input->GetMouseScroll(scrollX, m_scrollY);
        }
        else
        {
            m_mousePressed = false;
            m_mouseHeld = false;
            m_mouseReleased = false;
            m_scrollY = 0.0f;
        }
    }

    void EditorUI::EndFrame()
    {
        m_renderer = nullptr;
    }

    float EditorUI::TextWidth(const std::string &text, float scale)
    {
        return static_cast<float>(text.size()) * DrawTextCommand::GlyphWidth(scale);
    }

    void EditorUI::Rect(const UIRect &rect, const glm::vec4 &color)
    {
        if (!m_renderer || rect.Width <= 0.0f || rect.Height <= 0.0f)
        {
            return;
        }
        m_renderer->SubmitCommand(std::make_unique<DrawRectangleCommand>(
            rect.Center(), rect.Size(), 0.0f, color));
    }

    void EditorUI::RectOutline(const UIRect &rect, const glm::vec4 &color, float thickness)
    {
        if (!m_renderer || rect.Width <= 0.0f || rect.Height <= 0.0f)
        {
            return;
        }
        m_renderer->SubmitCommand(std::make_unique<DrawRectangleOutlineCommand>(
            rect.Center(), rect.Size(), color, thickness));
    }

    void EditorUI::Circle(const glm::vec2 &center, float radius, const glm::vec4 &color)
    {
        if (!m_renderer || radius <= 0.0f)
        {
            return;
        }
        m_renderer->SubmitCommand(std::make_unique<DrawCircleCommand>(center, radius, color));
    }

    void EditorUI::Line(const glm::vec2 &from, const glm::vec2 &to, const glm::vec4 &color)
    {
        if (!m_renderer)
        {
            return;
        }
        m_renderer->SubmitCommand(std::make_unique<DrawLineCommand>(from, to, color));
    }

    void EditorUI::Text(float x, float y, const std::string &text, const glm::vec4 &color, float scale)
    {
        if (!m_renderer || text.empty())
        {
            return;
        }
        m_renderer->SubmitCommand(std::make_unique<DrawTextCommand>(glm::vec2{x, y}, text, color, scale));
    }

    void EditorUI::TextClipped(const UIRect &bounds, float x, float y, const std::string &text, const glm::vec4 &color,
                               float scale)
    {
        if (text.empty() || y < bounds.Y || y + DrawTextCommand::GlyphHeight(scale) > bounds.Bottom())
        {
            return;
        }

        // The debug font is fixed width, so truncation is a simple character count.
        const float available = bounds.Right() - x;
        const auto maxChars = static_cast<size_t>(std::max(0.0f, available / DrawTextCommand::GlyphWidth(scale)));
        if (maxChars == 0)
        {
            return;
        }

        Text(x, y, text.size() > maxChars ? text.substr(0, maxChars) : text, color, scale);
    }

    UIRect EditorUI::Panel(const UIRect &bounds, const std::string &title)
    {
        Rect(bounds, EditorTheme::PanelBackground);
        Rect({bounds.X, bounds.Y, bounds.Width, EditorTheme::HeaderHeight}, EditorTheme::PanelHeader);
        RectOutline(bounds, EditorTheme::PanelBorder, 1.0f);
        Text(bounds.X + 10.0f, bounds.Y + 8.0f, title, EditorTheme::Text, EditorTheme::TextScale);

        return {
            bounds.X + 1.0f,
            bounds.Y + EditorTheme::HeaderHeight,
            bounds.Width - 2.0f,
            bounds.Height - EditorTheme::HeaderHeight - 1.0f,
        };
    }

    void EditorUI::PushClip(const UIRect &rect)
    {
        if (!m_renderer)
        {
            return;
        }
        m_renderer->SubmitCommand(std::make_unique<SetClipRectCommand>(glm::vec2{rect.X, rect.Y}, rect.Size()));
    }

    void EditorUI::ClearClip()
    {
        if (!m_renderer)
        {
            return;
        }
        m_renderer->SubmitCommand(std::make_unique<SetClipRectCommand>());
    }

    bool EditorUI::Button(const UIRect &rect, const std::string &label, bool enabled, bool active)
    {
        const bool hovered = enabled && IsHovered(rect);

        glm::vec4 background = EditorTheme::Button;
        if (active)
        {
            background = EditorTheme::ButtonActive;
        }
        else if (hovered)
        {
            background = EditorTheme::ButtonHover;
        }

        Rect(rect, background);
        RectOutline(rect, active ? EditorTheme::Accent : EditorTheme::PanelBorder, 1.0f);

        const glm::vec4 textColor = !enabled
            ? EditorTheme::TextDisabled
            : (active ? EditorTheme::TextOnAccent : EditorTheme::Text);

        const float textX = rect.X + std::max(4.0f, (rect.Width - TextWidth(label)) * 0.5f);
        const float textY = rect.Y + (rect.Height - DrawTextCommand::GlyphHeight(EditorTheme::TextScale)) * 0.5f;
        TextClipped(rect, textX, textY, label, textColor);

        if (!enabled || !hovered || !ClickAvailable())
        {
            return false;
        }

        ConsumeClick();
        return true;
    }

    bool EditorUI::Row(const UIRect &rect, const std::string &label, bool selected)
    {
        const bool hovered = IsHovered(rect);

        if (selected)
        {
            Rect(rect, EditorTheme::RowSelected);
        }
        else if (hovered)
        {
            Rect(rect, EditorTheme::RowHover);
        }

        const float textY = rect.Y + (rect.Height - DrawTextCommand::GlyphHeight(EditorTheme::TextScale)) * 0.5f;
        TextClipped(rect, rect.X + 8.0f, textY, label, selected ? EditorTheme::Text : EditorTheme::TextMuted);

        if (!hovered || !ClickAvailable())
        {
            return false;
        }

        ConsumeClick();
        return true;
    }

    bool EditorUI::ClickArea(const UIRect &rect)
    {
        if (!IsHovered(rect) || !ClickAvailable())
        {
            return false;
        }
        ConsumeClick();
        return true;
    }
}
