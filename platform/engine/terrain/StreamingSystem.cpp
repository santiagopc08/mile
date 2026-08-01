#include "engine/terrain/StreamingSystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>
#include <cmath>

namespace platform
{
    void StreamingSystem::registerSource(EntityID sourceEntity, int priority)
    {
        m_sources.push_back({sourceEntity, {0.0f, 0.0f}, {0.0f, 0.0f}, priority});
        LOG_INFO("[StreamingSystem] Registered streaming source entity #{}.", sourceEntity);
    }

    void StreamingSystem::unregisterSource(EntityID sourceEntity)
    {
        std::erase_if(m_sources, [sourceEntity](const StreamingSource &src) {
            return src.entity == sourceEntity;
        });
    }

    void StreamingSystem::setRadius(StreamingSettingsComponent &settings, float loadRadius, float unloadRadius)
    {
        settings.loadRadius = loadRadius;
        settings.unloadRadius = unloadRadius;
    }

    void StreamingSystem::forceReload(Registry &registry, ChunkManager &chunkManager, uint64_t seed)
    {
        (void)registry;
        (void)chunkManager;
        (void)seed;
    }

    void StreamingSystem::updateStreaming(Registry &registry, ChunkManager &chunkManager, uint64_t seed, double dt)
    {
        (void)dt;
        if (m_sources.empty()) return;

        // Update positions of registered sources
        for (auto &src : m_sources)
        {
            auto *tComp = registry.GetComponent<TransformComponent>(src.entity);
            if (tComp) src.position = tComp->Position;
            auto *rbComp = registry.GetComponent<RigidBodyComponent>(src.entity);
            if (rbComp) src.velocity = rbComp->LinearVelocity;
        }

        // Use primary source position
        glm::vec2 srcPos = m_sources[0].position;

        auto view = registry.GetView<StreamingSettingsComponent, StreamingRuntimeComponent>();
        view.Each([this, &registry, &chunkManager, seed, srcPos](EntityID entity, StreamingSettingsComponent &settings, StreamingRuntimeComponent &runtime) {
            (void)entity;
            float chunkLength = 200.0f;
            int centerIdx = static_cast<int>(std::floor(srcPos.x / chunkLength));
            if (centerIdx < 0) centerIdx = 0;
            runtime.centerChunk = static_cast<uint32_t>(centerIdx);

            int minIdx = std::max(0, centerIdx - static_cast<int>(settings.loadRadius / chunkLength));
            int maxIdx = centerIdx + static_cast<int>(settings.loadRadius / chunkLength);

            uint32_t loads = 0;
            for (int i = minIdx; i <= maxIdx; ++i)
            {
                uint32_t idx = static_cast<uint32_t>(i);
                if (chunkManager.findChunk(idx) == kNullEntity)
                {
                    chunkManager.createChunk(registry, idx, seed, chunkLength);
                    loads++;
                }
            }

            runtime.loadedChunks = static_cast<uint32_t>(chunkManager.chunkCount());
            runtime.pendingLoads = loads;
            runtime.pendingUnloads = 0;
        });
    }
}
