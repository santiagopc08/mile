#ifndef PLATFORM_ENGINE_FILESYSTEM_FILE_WATCH_SERVICE_HPP
#define PLATFORM_ENGINE_FILESYSTEM_FILE_WATCH_SERVICE_HPP

#include "engine/filesystem/VirtualFileSystem.hpp"
#include <functional>
#include <string>
#include <vector>

namespace platform
{
    enum class FileWatchEventType
    {
        Created,
        Modified,
        Deleted,
        Moved,
        Renamed
    };

    using FileWatchCallbackFn = std::function<void(FileWatchEventType eventType, const VirtualPath &vpath)>;

    class FileWatchService
    {
    public:
        FileWatchService() = default;

        void Initialize(VirtualFileSystem *vfs);
        void SetCallback(FileWatchCallbackFn callback) { m_callback = std::move(callback); }

        void TriggerEvent(FileWatchEventType type, const VirtualPath &vpath);
        void Poll();

        [[nodiscard]] uint64_t GetTotalEventsTriggered() const { return m_totalEvents; }
        [[nodiscard]] bool IsActive() const { return m_active; }

    private:
        struct PendingEvent
        {
            FileWatchEventType Type;
            VirtualPath Path;
        };

        VirtualFileSystem *m_vfs{nullptr};
        FileWatchCallbackFn m_callback;
        std::vector<PendingEvent> m_pendingEvents;
        uint64_t m_totalEvents{0};
        bool m_active{false};
    };
}

#endif // PLATFORM_ENGINE_FILESYSTEM_FILE_WATCH_SERVICE_HPP
