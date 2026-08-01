#include "editor/app/EditorContext.hpp"

#include "editor/panels/ConsolePanel.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void EditorContext::Log(const std::string &level, const std::string &message)
    {
        if (Console)
        {
            Console->AddLogMessage(level, message);
        }

        if (level == "Error")
        {
            LOG_ERROR("[Editor] {}", message);
        }
        else if (level == "Warn")
        {
            LOG_WARN("[Editor] {}", message);
        }
        else
        {
            LOG_INFO("[Editor] {}", message);
        }
    }
}
