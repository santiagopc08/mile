#ifndef PLATFORM_EDITOR_PANELS_CONSOLE_PANEL_HPP
#define PLATFORM_EDITOR_PANELS_CONSOLE_PANEL_HPP

#include "editor/panels/EditorPanel.hpp"
#include <vector>
#include <string>

namespace platform
{
    struct ConsoleLogMessage
    {
        std::string Level;
        std::string Text;
    };

    class ConsolePanel : public EditorPanel
    {
    public:
        ConsolePanel();

        void OnRender(EditorContext &context) override;
        [[nodiscard]] const std::string &GetName() const override { return m_name; }

        void AddLogMessage(const std::string &level, const std::string &message);
        void ClearLogs();

        [[nodiscard]] const std::vector<ConsoleLogMessage> &GetLogs() const { return m_logs; }

    private:
        static constexpr size_t kMaxLogs = 400;

        std::string m_name{"Console"};
        std::vector<ConsoleLogMessage> m_logs;
        float m_scroll{0.0f};
        bool m_stickToBottom{true};
    };
}

#endif // PLATFORM_EDITOR_PANELS_CONSOLE_PANEL_HPP
