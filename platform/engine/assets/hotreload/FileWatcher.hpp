#ifndef PLATFORM_ENGINE_ASSETS_HOTRELOAD_FILE_WATCHER_HPP
#define PLATFORM_ENGINE_ASSETS_HOTRELOAD_FILE_WATCHER_HPP

#include <string>
#include <vector>
#include <functional>
#include <unordered_map>

namespace platform
{
    using FileChangeCallbackFn = std::function<void(const std::string &path)>;

    class FileWatcher
    {
    public:
        FileWatcher() = default;

        void WatchDirectory(const std::string &directoryPath);
        void SetOnModifiedCallback(FileChangeCallbackFn callback) { m_onModified = std::move(callback); }

        void TriggerFileModification(const std::string &filePath);
        void PollChanges();

        [[nodiscard]] bool IsWatching() const { return m_active; }

    private:
        std::string m_watchedDir;
        FileChangeCallbackFn m_onModified;
        std::vector<std::string> m_pendingModifications;
        bool m_active{false};
    };
}

#endif // PLATFORM_ENGINE_ASSETS_HOTRELOAD_FILE_WATCHER_HPP
