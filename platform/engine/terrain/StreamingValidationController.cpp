#include "engine/terrain/StreamingValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void StreamingValidationController::Initialize()
    {
        m_state = StreamingValidationState::SpawnVehicle;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[StreamingValidationController] Initialized autonomous terrain streaming validation sequence.");
    }

    std::string StreamingValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case StreamingValidationState::SpawnVehicle: return "SpawnVehicle";
        case StreamingValidationState::DriveContinuously: return "DriveContinuously";
        case StreamingValidationState::LoadNewChunks: return "LoadNewChunks";
        case StreamingValidationState::UnloadOldChunks: return "UnloadOldChunks";
        case StreamingValidationState::ReverseDirection: return "ReverseDirection";
        case StreamingValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void StreamingValidationController::Update(Registry &registry, ChunkManager &chunkManager, StreamingSystem &streamingSystem, EntityID vehicleEntity, uint64_t seed, double dt)
    {
        m_stateTimer += dt;
        auto *tComp = registry.GetComponent<TransformComponent>(vehicleEntity);

        switch (m_state)
        {
        case StreamingValidationState::SpawnVehicle:
            if (tComp) tComp->Position = {0.0f, 0.0f};
            streamingSystem.updateStreaming(registry, chunkManager, seed, dt);
            if (m_stateTimer >= 0.1)
            {
                m_state = StreamingValidationState::DriveContinuously;
                m_stateTimer = 0.0;
                LOG_INFO("[StreamingValidationController] Transitioned -> DriveContinuously");
            }
            break;

        case StreamingValidationState::DriveContinuously:
            if (tComp) tComp->Position.x += 100.0f * static_cast<float>(dt);
            streamingSystem.updateStreaming(registry, chunkManager, seed, dt);
            if (m_stateTimer >= 0.2)
            {
                m_state = StreamingValidationState::LoadNewChunks;
                m_stateTimer = 0.0;
                LOG_INFO("[StreamingValidationController] Transitioned -> LoadNewChunks");
            }
            break;

        case StreamingValidationState::LoadNewChunks:
            if (tComp) tComp->Position.x += 200.0f * static_cast<float>(dt);
            streamingSystem.updateStreaming(registry, chunkManager, seed, dt);
            if (m_stateTimer >= 0.1)
            {
                m_state = StreamingValidationState::UnloadOldChunks;
                m_stateTimer = 0.0;
                LOG_INFO("[StreamingValidationController] Transitioned -> UnloadOldChunks");
            }
            break;

        case StreamingValidationState::UnloadOldChunks:
            if (tComp) tComp->Position.x += 300.0f * static_cast<float>(dt);
            streamingSystem.updateStreaming(registry, chunkManager, seed, dt);
            if (m_stateTimer >= 0.1)
            {
                m_state = StreamingValidationState::ReverseDirection;
                m_stateTimer = 0.0;
                LOG_INFO("[StreamingValidationController] Transitioned -> ReverseDirection");
            }
            break;

        case StreamingValidationState::ReverseDirection:
            if (tComp) tComp->Position.x -= 200.0f * static_cast<float>(dt);
            streamingSystem.updateStreaming(registry, chunkManager, seed, dt);
            if (m_stateTimer >= 0.1)
            {
                m_state = StreamingValidationState::Repeat;
                m_stateTimer = 0.0;
                m_cycleCount++;
                LOG_INFO("[StreamingValidationController] Completed full streaming validation cycle (Count: {}).", m_cycleCount);
            }
            break;

        case StreamingValidationState::Repeat:
            m_state = StreamingValidationState::SpawnVehicle;
            m_stateTimer = 0.0;
            break;
        }
    }
}
