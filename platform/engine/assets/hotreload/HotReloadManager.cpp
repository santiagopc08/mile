#include "engine/assets/hotreload/HotReloadManager.hpp"
#include "engine/assets/events/AssetEvents.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    HotReloadManager::HotReloadManager() = default;

    void HotReloadManager::Initialize(AssetDatabase *database, AssetCache *cache, EventQueue *eventQueue)
    {
        m_database = database;
        m_cache = cache;
        m_eventQueue = eventQueue;
        m_active = true;

        m_watcher.WatchDirectory("assets/");
        m_watcher.SetOnModifiedCallback([this](const std::string &path) {
            if (!m_database) return;

            const AssetMetadata *meta = m_database->GetRegistry().FindByName(path);
            if (meta)
            {
                LOG_INFO("[HotReloadManager] Hot reloading asset '{}' (ID: {})...", meta->Name, meta->ID);
                m_database->ReimportAsset(meta->ID);

                if (m_cache)
                {
                    m_cache->Remove(meta->ID);
                }

                m_totalReloads++;

                if (m_eventQueue)
                {
                    m_eventQueue->Push(std::make_shared<AssetReloadedEvent>(meta->ID, meta->Name));
                }
            }
        });

        LOG_INFO("[HotReloadManager] Hot Reload system active.");
    }

    void HotReloadManager::Update(double dt)
    {
        (void)dt;
        if (!m_active)
        {
            return;
        }

        m_watcher.PollChanges();
    }

    void HotReloadManager::SimulateFileModification(const std::string &filePath)
    {
        m_watcher.TriggerFileModification(filePath);
    }
}
