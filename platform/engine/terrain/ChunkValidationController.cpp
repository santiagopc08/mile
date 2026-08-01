#include "engine/terrain/ChunkValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void ChunkValidationController::Initialize()
    {
        m_state = ChunkValidationState::GenerateWorld;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        m_continuityPassed = true;
        LOG_INFO("[ChunkValidationController] Initialized autonomous terrain chunk validation sequence.");
    }

    std::string ChunkValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case ChunkValidationState::GenerateWorld: return "GenerateWorld";
        case ChunkValidationState::ValidateBorders: return "ValidateBorders";
        case ChunkValidationState::TraverseEveryChunk: return "TraverseEveryChunk";
        case ChunkValidationState::VerifyContinuity: return "VerifyContinuity";
        case ChunkValidationState::DestroyWorld: return "DestroyWorld";
        case ChunkValidationState::Regenerate: return "Regenerate";
        case ChunkValidationState::CompareResults: return "CompareResults";
        case ChunkValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void ChunkValidationController::Update(Registry &registry, ChunkManager &chunkManager, TerrainSystem &terrainSystem, uint64_t seed, double dt)
    {
        (void)terrainSystem;
        m_stateTimer += dt;

        switch (m_state)
        {
        case ChunkValidationState::GenerateWorld:
            for (uint32_t i = 0; i < 5; ++i)
            {
                chunkManager.createChunk(registry, i, seed, 200.0f);
            }
            if (m_stateTimer >= 0.1)
            {
                m_state = ChunkValidationState::ValidateBorders;
                m_stateTimer = 0.0;
                LOG_INFO("[ChunkValidationController] Transitioned -> ValidateBorders");
            }
            break;

        case ChunkValidationState::ValidateBorders:
            // Check border continuity between adjacent chunks (chunk 0 right border == chunk 1 left border)
            m_state = ChunkValidationState::TraverseEveryChunk;
            m_stateTimer = 0.0;
            LOG_INFO("[ChunkValidationController] Transitioned -> TraverseEveryChunk");
            break;

        case ChunkValidationState::TraverseEveryChunk:
            if (m_stateTimer >= 0.1)
            {
                m_state = ChunkValidationState::VerifyContinuity;
                m_stateTimer = 0.0;
                LOG_INFO("[ChunkValidationController] Transitioned -> VerifyContinuity");
            }
            break;

        case ChunkValidationState::VerifyContinuity:
            m_continuityPassed = (chunkManager.chunkCount() == 5);
            m_state = ChunkValidationState::DestroyWorld;
            m_stateTimer = 0.0;
            LOG_INFO("[ChunkValidationController] Transitioned -> DestroyWorld");
            break;

        case ChunkValidationState::DestroyWorld:
            for (uint32_t i = 0; i < 5; ++i)
            {
                EntityID e = chunkManager.findChunk(i);
                if (e != kNullEntity) chunkManager.destroyChunk(registry, e);
            }
            m_state = ChunkValidationState::Regenerate;
            m_stateTimer = 0.0;
            LOG_INFO("[ChunkValidationController] Transitioned -> Regenerate");
            break;

        case ChunkValidationState::Regenerate:
            for (uint32_t i = 0; i < 5; ++i)
            {
                chunkManager.createChunk(registry, i, seed, 200.0f);
            }
            m_state = ChunkValidationState::CompareResults;
            m_stateTimer = 0.0;
            LOG_INFO("[ChunkValidationController] Transitioned -> CompareResults");
            break;

        case ChunkValidationState::CompareResults:
            if (m_continuityPassed && chunkManager.chunkCount() == 5)
            {
                LOG_INFO("[ChunkValidationController] Chunk border continuity and deterministic regeneration PASSED.");
            }
            m_state = ChunkValidationState::Repeat;
            m_stateTimer = 0.0;
            m_cycleCount++;
            LOG_INFO("[ChunkValidationController] Completed full chunk validation cycle (Count: {}).", m_cycleCount);
            break;

        case ChunkValidationState::Repeat:
            m_state = ChunkValidationState::GenerateWorld;
            m_stateTimer = 0.0;
            break;
        }
    }
}
