#ifndef PLATFORM_ENGINE_PIPELINE_DEBUG_CONTENT_DIAGNOSTICS_HPP
#define PLATFORM_ENGINE_PIPELINE_DEBUG_CONTENT_DIAGNOSTICS_HPP

#include <cstdint>
#include <cstddef>

namespace platform
{
    struct ContentDiagnostics
    {
        size_t MountedProviders{6};
        size_t VirtualPaths{58};
        size_t LoadedAssets{41};
        size_t CompiledResources{68};
        float CacheHitRate{0.97f};
        double PipelineTimeMs{182.0};
        uint64_t FileWatchEvents{14};
        size_t DependencyCount{89};
    };
}

#endif // PLATFORM_ENGINE_PIPELINE_DEBUG_CONTENT_DIAGNOSTICS_HPP
