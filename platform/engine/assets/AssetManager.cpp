#include "engine/assets/AssetManager.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AssetManager::AssetManager() = default;

    AssetManager::~AssetManager()
    {
        Shutdown();
    }

    bool AssetManager::Initialize(EventQueue *eventQueue)
    {
        if (m_initialized)
        {
            return true;
        }

        m_eventQueue = eventQueue;
        m_database.Initialize("asset_database.manifest");
        m_hotReload.Initialize(&m_database, &m_cache, m_eventQueue);

        m_initialized = true;
        LOG_INFO("[AssetManager] Asset Framework initialized successfully.");
        return true;
    }

    void AssetManager::Shutdown()
    {
        if (!m_initialized)
        {
            return;
        }

        m_cache.Clear();
        m_graph.Clear();
        m_database.GetRegistry().Clear();
        m_initialized = false;
        LOG_INFO("[AssetManager] Asset Framework shutdown complete.");
    }

    void AssetManager::Update(double dt)
    {
        if (!m_initialized)
        {
            return;
        }

        m_hotReload.Update(dt);
    }

    bool AssetManager::ImportAsset(const std::string &sourcePath, const std::string &outputPath)
    {
        size_t extIdx = sourcePath.find_last_of('.');
        std::string ext = (extIdx != std::string::npos) ? sourcePath.substr(extIdx) : "";

        IAssetImporter *importer = m_importerFactory.GetImporterForExtension(ext);
        if (!importer)
        {
            LOG_ERROR("[AssetManager] No importer registered for file extension '{}'.", ext);
            return false;
        }

        AssetMetadata meta;
        if (!importer->Import(sourcePath, outputPath, meta))
        {
            LOG_ERROR("[AssetManager] Failed to import asset '{}'.", sourcePath);
            return false;
        }

        return m_database.GetRegistry().RegisterAsset(meta);
    }
}
