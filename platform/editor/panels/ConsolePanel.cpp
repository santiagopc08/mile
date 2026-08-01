#include "editor/panels/ConsolePanel.hpp"
#include "engine/core/Logger.hpp"

#include <algorithm>

namespace platform
{
    namespace
    {
        glm::vec4 LevelColor(const std::string &level)
        {
            if (level == "Error") return EditorTheme::Danger;
            if (level == "Warn") return EditorTheme::Warning;
            if (level == "Success") return EditorTheme::Success;
            return EditorTheme::TextMuted;
        }
    }

    ConsolePanel::ConsolePanel()
    {
        AddLogMessage("Info", "Editor Console initialized.");
    }

    void ConsolePanel::OnRender(EditorContext &context)
    {
        if (!m_visible) return;

        if (!context.UI)
        {
            return;
        }

        auto &ui = *context.UI;
        const UIRect content = ui.Panel(m_bounds, "CONSOLE  (" + std::to_string(m_logs.size()) + ")");

        const UIRect clearButton{m_bounds.Right() - 76.0f, m_bounds.Y + 3.0f, 70.0f, 20.0f};
        if (ui.Button(clearButton, "CLEAR"))
        {
            ClearLogs();
            return;
        }

        constexpr float lineHeight = 18.0f;
        const float totalHeight = static_cast<float>(m_logs.size()) * lineHeight;
        const float maxScroll = std::max(0.0f, totalHeight - content.Height + 8.0f);

        if (ui.IsHovered(content) && ui.ScrollDelta() != 0.0f)
        {
            m_scroll = std::clamp(m_scroll - ui.ScrollDelta() * lineHeight * 2.0f, 0.0f, maxScroll);
            m_stickToBottom = m_scroll >= maxScroll - 1.0f;
        }

        if (m_stickToBottom)
        {
            m_scroll = maxScroll;
        }
        m_scroll = std::clamp(m_scroll, 0.0f, maxScroll);

        for (size_t i = 0; i < m_logs.size(); ++i)
        {
            const float lineY = content.Y + 4.0f + static_cast<float>(i) * lineHeight - m_scroll;
            if (lineY + lineHeight < content.Y || lineY > content.Bottom())
            {
                continue;
            }

            const auto &entry = m_logs[i];
            constexpr float levelColumn = 66.0f;
            ui.TextClipped(content, content.X + 8.0f, lineY, entry.Level.substr(0, 4), LevelColor(entry.Level));
            ui.TextClipped(content, content.X + 8.0f + levelColumn, lineY, entry.Text, EditorTheme::Text);
        }
    }

    void ConsolePanel::AddLogMessage(const std::string &level, const std::string &message)
    {
        m_logs.push_back({level, message});
        if (m_logs.size() > kMaxLogs)
        {
            m_logs.erase(m_logs.begin(), m_logs.begin() + static_cast<long>(m_logs.size() - kMaxLogs));
        }
        m_stickToBottom = true;
    }

    void ConsolePanel::ClearLogs()
    {
        m_logs.clear();
        m_scroll = 0.0f;
        m_stickToBottom = true;
    }
}
