#include "engine/terrain/TerrainManager.hpp"
#include "engine/core/Logger.hpp"
#include <cmath>
#include <vector>

namespace platform
{
    TerrainManager::TerrainManager(const TerrainConfig &config)
        : m_config(config), m_generator(config)
    {
    }

    TerrainManager::~TerrainManager() = default;

    void TerrainManager::Initialize(const TerrainConfig &config)
    {
        m_config = config;
        m_generator.SetConfig(config);
        LOG_INFO("[TerrainManager] Terrain initialized with seed {}.", config.GenerationSeed);
    }

    void TerrainManager::Shutdown(PhysicsWorld &physicsWorld)
    {
        for (auto &[idx, chunk] : m_chunks)
        {
            if (chunk)
            {
                chunk->DestroyPhysics(physicsWorld);
            }
        }
        m_chunks.clear();
        LOG_INFO("[TerrainManager] Terrain manager shutdown complete.");
    }

    void TerrainManager::UpdateStreaming(const glm::vec2 &cameraPosition, PhysicsWorld &physicsWorld)
    {
        float camX = cameraPosition.x;
        float chunkW = m_config.ChunkWidth;

        int32_t centerChunkIdx = static_cast<int32_t>(std::floor(camX / chunkW));
        int radius = static_cast<int>(m_config.StreamingDistance / chunkW);

        int32_t minChunk = centerChunkIdx - radius;
        int32_t maxChunk = centerChunkIdx + radius;

        // 1. Generate & Load missing chunks
        for (int32_t idx = minChunk; idx <= maxChunk; ++idx)
        {
            if (m_chunks.find(idx) == m_chunks.end())
            {
                float startX = static_cast<float>(idx) * chunkW;
                auto chunk = std::make_unique<TerrainChunk>(idx, startX, chunkW);
                chunk->Generate(m_generator, m_config);
                chunk->BuildPhysics(physicsWorld);
                m_chunks[idx] = std::move(chunk);
            }
        }

        // 2. Unload distant chunks outside streaming bounds
        std::vector<int32_t> toRemove;
        for (const auto &[idx, chunk] : m_chunks)
        {
            if (idx < minChunk || idx > maxChunk)
            {
                toRemove.push_back(idx);
            }
        }

        for (int32_t idx : toRemove)
        {
            auto it = m_chunks.find(idx);
            if (it != m_chunks.end())
            {
                if (it->second)
                {
                    it->second->DestroyPhysics(physicsWorld);
                }
                m_chunks.erase(it);
            }
        }
    }
}
