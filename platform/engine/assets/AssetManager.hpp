#ifndef PLATFORM_ENGINE_ASSETS_ASSET_MANAGER_HPP
#define PLATFORM_ENGINE_ASSETS_ASSET_MANAGER_HPP

#include "engine/assets/database/AssetDatabase.hpp"
#include "engine/assets/cache/AssetCache.hpp"
#include "engine/assets/importers/ImporterFactory.hpp"
#include "engine/assets/graph/DependencyGraph.hpp"
#include "engine/assets/hotreload/HotReloadManager.hpp"
#include "engine/assets/handles/AssetHandle.hpp"
#include "engine/events/EventQueue.hpp"
#include <memory>

namespace platform
{
    class AssetManager
    {
    public:
        AssetManager();
        ~AssetManager();

        bool Initialize(EventQueue *eventQueue = nullptr);
        void Shutdown();

        void Update(double dt);

        template <typename T>
        AssetHandle<T> LoadAsset(const std::string &sourcePath, AssetType type)
        {
            if (!m_initialized)
            {
                return AssetHandle<T>();
            }

            const AssetMetadata *meta = m_database.GetRegistry().FindByName(sourcePath);
            if (!meta)
            {
                m_database.CreateAsset(sourcePath, type);
                meta = m_database.GetRegistry().FindByName(sourcePath);
            }

            if (!meta)
            {
                return AssetHandle<T>(kInvalidAssetID, nullptr, HandleState::Missing);
            }

            // Check Cache
            if (m_cache.Contains(meta->ID))
            {
                auto cachedAsset = m_cache.Get(meta->ID);
                auto typedPtr = std::dynamic_pointer_cast<T>(cachedAsset);
                return AssetHandle<T>(meta->ID, typedPtr, HandleState::Ready);
            }

            // Instantiate Asset
            auto newAsset = std::make_shared<T>(*meta);
            newAsset->Load();
            m_cache.Store(meta->ID, newAsset, CachePolicy::Shared);

            return AssetHandle<T>(meta->ID, newAsset, HandleState::Ready);
        }

        bool ImportAsset(const std::string &sourcePath, const std::string &outputPath);

        [[nodiscard]] AssetRegistry &GetRegistry() { return m_database.GetRegistry(); }
        [[nodiscard]] const AssetRegistry &GetRegistry() const { return m_database.GetRegistry(); }

        [[nodiscard]] AssetDatabase &GetDatabase() { return m_database; }
        [[nodiscard]] AssetCache &GetCache() { return m_cache; }
        [[nodiscard]] DependencyGraph &GetDependencyGraph() { return m_graph; }
        [[nodiscard]] HotReloadManager &GetHotReloadManager() { return m_hotReload; }
        [[nodiscard]] bool IsInitialized() const { return m_initialized; }

    private:
        AssetDatabase m_database;
        AssetCache m_cache;
        ImporterFactory m_importerFactory;
        DependencyGraph m_graph;
        HotReloadManager m_hotReload;
        EventQueue *m_eventQueue{nullptr};

        bool m_initialized{false};
    };
}

#endif // PLATFORM_ENGINE_ASSETS_ASSET_MANAGER_HPP
