#include "engine/assets/hotreload/FileWatcher.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void FileWatcher::WatchDirectory(const std::string &directoryPath)
    {
        m_watchedDir = directoryPath;
        m_active = true;
        LOG_INFO("[FileWatcher] Watching directory '{}' for asset changes.", m_watchedDir);
    }

    void FileWatcher::TriggerFileModification(const std::string &filePath)
    {
        m_pendingModifications.push_back(filePath);
    }

    void FileWatcher::PollChanges()
    {
        if (m_pendingModifications.empty())
        {
            return;
        }

        for (const auto &file : m_pendingModifications)
        {
            LOG_INFO("[FileWatcher] Detected modification in file '{}'.", file);
            if (m_onModified)
            {
                m_onModified(file);
            }
        }
        m_pendingModifications.clear();
    }
}
