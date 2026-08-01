#include "engine/filesystem/FileWatchService.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void FileWatchService::Initialize(VirtualFileSystem *vfs)
    {
        m_vfs = vfs;
        m_active = true;
        LOG_INFO("[FileWatchService] File Watch Service active across VFS mounts.");
    }

    void FileWatchService::TriggerEvent(FileWatchEventType type, const VirtualPath &vpath)
    {
        m_pendingEvents.push_back({type, vpath});
        m_totalEvents++;
    }

    void FileWatchService::Poll()
    {
        if (m_pendingEvents.empty())
        {
            return;
        }

        for (const auto &event : m_pendingEvents)
        {
            LOG_INFO("[FileWatchService] File watch event in '{}'.", event.Path.GetFullPath());
            if (m_callback)
            {
                m_callback(event.Type, event.Path);
            }
        }
        m_pendingEvents.clear();
    }
}
