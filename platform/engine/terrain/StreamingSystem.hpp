#ifndef PLATFORM_ENGINE_TERRAIN_STREAMING_SYSTEM_HPP
#define PLATFORM_ENGINE_TERRAIN_STREAMING_SYSTEM_HPP

#include "engine/terrain/StreamingSettingsComponent.hpp"
#include "engine/terrain/StreamingRuntimeComponent.hpp"
#include "engine/terrain/ChunkManager.hpp"
#include "engine/scene/Registry.hpp"
#include <glm/glm.hpp>
#include <vector>

namespace platform
{
    struct StreamingSource
    {
        EntityID entity{kNullEntity};
        glm::vec2 position{0.0f, 0.0f};
        glm::vec2 velocity{0.0f, 0.0f};
        int priority{1};
    };

    class StreamingSystem
    {
    public:
        StreamingSystem() = default;

        void registerSource(EntityID sourceEntity, int priority = 1);
        void unregisterSource(EntityID sourceEntity);

        void updateStreaming(Registry &registry, ChunkManager &chunkManager, uint64_t seed, double dt);
        void forceReload(Registry &registry, ChunkManager &chunkManager, uint64_t seed);
        void setRadius(StreamingSettingsComponent &settings, float loadRadius, float unloadRadius);

        [[nodiscard]] uint32_t loadedChunkCount(const StreamingRuntimeComponent &runtime) const { return runtime.loadedChunks; }
        [[nodiscard]] uint32_t pendingLoads(const StreamingRuntimeComponent &runtime) const { return runtime.pendingLoads; }
        [[nodiscard]] uint32_t pendingUnloads(const StreamingRuntimeComponent &runtime) const { return runtime.pendingUnloads; }
        [[nodiscard]] float streamingRadius(const StreamingSettingsComponent &settings) const { return settings.loadRadius; }

    private:
        std::vector<StreamingSource> m_sources;
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_STREAMING_SYSTEM_HPP
