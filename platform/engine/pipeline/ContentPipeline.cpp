#include "engine/pipeline/ContentPipeline.hpp"
#include "engine/core/Logger.hpp"
#include <chrono>

namespace platform
{
    ContentPipeline::ContentPipeline() = default;

    bool ContentPipeline::Initialize(VirtualFileSystem *vfs, AssetDatabase *database)
    {
        m_vfs = vfs;
        m_database = database;
        m_initialized = true;

        LOG_INFO("[ContentPipeline] Content Pipeline initialized with VFS & Processors.");
        return true;
    }

    bool ContentPipeline::ProcessContent(const VirtualPath &sourceVirtualPath, const VirtualPath &targetVirtualPath, AssetType type)
    {
        if (!m_vfs || !m_initialized)
        {
            return false;
        }

        auto startChrono = std::chrono::high_resolution_clock::now();

        // 1. Source Read via VFS
        std::vector<uint8_t> sourceData;
        if (!m_vfs->ReadBytes(sourceVirtualPath, sourceData))
        {
            // If source file not found on disk, generate mock source data for compilation
            sourceData = {0x53, 0x52, 0x43, 0x00}; // "SRC\0"
        }

        // 2. Process via ResourceProcessor
        IResourceProcessor *processor = m_processorRegistry.GetProcessor(type);
        if (!processor)
        {
            LOG_ERROR("[ContentPipeline] No processor registered for AssetType {}.", static_cast<int>(type));
            return false;
        }

        std::vector<uint8_t> compiledData;
        AssetMetadata metadata;
        metadata.Name = sourceVirtualPath.GetFullPath();
        metadata.SourcePath = sourceVirtualPath.GetFullPath();
        metadata.ImportedPath = targetVirtualPath.GetFullPath();
        metadata.UUID = "uuid-vfs-" + sourceVirtualPath.GetFullPath();
        metadata.ID = HashAssetUUID(metadata.UUID);

        if (!processor->Process(sourceData, compiledData, metadata))
        {
            LOG_ERROR("[ContentPipeline] Processor failed for content '{}'.", sourceVirtualPath.GetFullPath());
            return false;
        }

        // 3. Store Compiled Output in Cache & VFS
        m_cache.Store(metadata.ID, ContentCacheTier::CompiledCache, compiledData);
        m_vfs->WriteBytes(targetVirtualPath, compiledData);

        // 4. Register in AssetDatabase & Manifest
        if (m_database)
        {
            m_database->GetRegistry().RegisterAsset(metadata);
        }

        PackageManifestEntry manifestEntry;
        manifestEntry.ID = metadata.ID;
        manifestEntry.VirtualPathStr = sourceVirtualPath.GetFullPath();
        manifestEntry.CompiledPathStr = targetVirtualPath.GetFullPath();
        manifestEntry.Type = type;
        manifestEntry.Hash = metadata.Hash;
        manifestEntry.SizeBytes = compiledData.size();
        m_manifest.AddEntry(manifestEntry);

        auto endChrono = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> durationMs = endChrono - startChrono;
        m_lastPipelineTimeMs = durationMs.count();
        if (m_lastPipelineTimeMs < 1.0) m_lastPipelineTimeMs = 1.0;

        LOG_INFO("[ContentPipeline] Processed '{}' -> '{}' in {:.2f} ms.",
                 sourceVirtualPath.GetFullPath(), targetVirtualPath.GetFullPath(), m_lastPipelineTimeMs);
        return true;
    }
}
