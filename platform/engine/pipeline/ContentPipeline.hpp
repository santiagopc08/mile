#ifndef PLATFORM_ENGINE_PIPELINE_CONTENT_PIPELINE_HPP
#define PLATFORM_ENGINE_PIPELINE_CONTENT_PIPELINE_HPP

#include "engine/filesystem/VirtualFileSystem.hpp"
#include "engine/pipeline/processors/ProcessorRegistry.hpp"
#include "engine/pipeline/PackageManifest.hpp"
#include "engine/pipeline/ContentCache.hpp"
#include "engine/assets/database/AssetDatabase.hpp"

namespace platform
{
    class ContentPipeline
    {
    public:
        ContentPipeline();

        bool Initialize(VirtualFileSystem *vfs, AssetDatabase *database);

        bool ProcessContent(const VirtualPath &sourceVirtualPath, const VirtualPath &targetVirtualPath, AssetType type);

        [[nodiscard]] VirtualFileSystem *GetVFS() const { return m_vfs; }
        [[nodiscard]] PackageManifest &GetManifest() { return m_manifest; }
        [[nodiscard]] const PackageManifest &GetManifest() const { return m_manifest; }
        [[nodiscard]] ContentCache &GetContentCache() { return m_cache; }
        [[nodiscard]] double GetLastPipelineTimeMs() const { return m_lastPipelineTimeMs; }
        [[nodiscard]] bool IsInitialized() const { return m_initialized; }

    private:
        VirtualFileSystem *m_vfs{nullptr};
        AssetDatabase *m_database{nullptr};
        ProcessorRegistry m_processorRegistry;
        PackageManifest m_manifest;
        ContentCache m_cache;

        double m_lastPipelineTimeMs{182.0};
        bool m_initialized{false};
    };
}

#endif // PLATFORM_ENGINE_PIPELINE_CONTENT_PIPELINE_HPP
