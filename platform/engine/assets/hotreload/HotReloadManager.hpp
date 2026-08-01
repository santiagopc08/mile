#ifndef PLATFORM_ENGINE_ASSETS_HOTRELOAD_HOT_RELOAD_MANAGER_HPP
#define PLATFORM_ENGINE_ASSETS_HOTRELOAD_HOT_RELOAD_MANAGER_HPP

#include "engine/assets/hotreload/FileWatcher.hpp"
#include "engine/assets/database/AssetDatabase.hpp"
#include "engine/assets/cache/AssetCache.hpp"
#include "engine/events/EventQueue.hpp"

namespace platform
{
    class HotReloadManager
    {
    public:
        HotReloadManager();

        void Initialize(AssetDatabase *database, AssetCache *cache, EventQueue *eventQueue);
        void Update(double dt);

        void SimulateFileModification(const std::string &filePath);

        [[nodiscard]] bool IsActive() const { return m_active; }
        [[nodiscard]] uint64_t GetTotalReloads() const { return m_totalReloads; }

    private:
        FileWatcher m_watcher;
        AssetDatabase *m_database{nullptr};
        AssetCache *m_cache{nullptr};
        EventQueue *m_eventQueue{nullptr};

        uint64_t m_totalReloads{0};
        bool m_active{false};
    };
}

#endif // PLATFORM_ENGINE_ASSETS_HOTRELOAD_HOT_RELOAD_MANAGER_HPP
