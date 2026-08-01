#include "engine/graphics/camera/PlatformCameraValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void PlatformCameraValidationController::Initialize()
    {
        m_step = PlatformCamValidationStep::Walk;
        m_character = kNullEntity;
        m_camera = kNullEntity;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[PlatformCameraValidationController] Initialized autonomous platform camera validation sequence.");
    }

    std::string PlatformCameraValidationController::GetStateName() const
    {
        switch (m_step)
        {
        case PlatformCamValidationStep::Walk: return "Walk";
        case PlatformCamValidationStep::Run: return "Run";
        case PlatformCamValidationStep::Jump: return "Jump";
        case PlatformCamValidationStep::Fall: return "Fall";
        case PlatformCamValidationStep::Stop: return "Stop";
        case PlatformCamValidationStep::Reverse: return "Reverse";
        case PlatformCamValidationStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void PlatformCameraValidationController::Update(Registry &registry, CharacterSystem &charSystem, CharacterMovementSystem &moveSystem, PlatformCameraSystem &camSystem, double dt)
    {
        m_stepTimer += dt;

        if (m_character == kNullEntity)
        {
            m_character = charSystem.spawnCharacter(registry, 1, CharacterType::Player, {0.0f, 0.0f});
            m_camera = registry.CreateEntity("PlatformCamera");
            registry.AddComponent<TransformComponent>(m_camera);
            camSystem.setTarget(registry, m_camera, m_character);
        }

        switch (m_step)
        {
        case PlatformCamValidationStep::Walk:
            moveSystem.moveRight(registry, m_character, 1.0f);
            if (m_stepTimer >= 0.05)
            {
                m_step = PlatformCamValidationStep::Run;
                m_stepTimer = 0.0;
                LOG_INFO("[PlatformCameraValidationController] Transitioned -> Run");
            }
            break;

        case PlatformCamValidationStep::Run:
            moveSystem.enableRunning(registry, m_character, true);
            moveSystem.moveRight(registry, m_character, 1.0f);
            if (m_stepTimer >= 0.05)
            {
                m_step = PlatformCamValidationStep::Jump;
                m_stepTimer = 0.0;
                LOG_INFO("[PlatformCameraValidationController] Transitioned -> Jump");
            }
            break;

        case PlatformCamValidationStep::Jump:
            if (m_stepTimer >= 0.05)
            {
                m_step = PlatformCamValidationStep::Fall;
                m_stepTimer = 0.0;
                LOG_INFO("[PlatformCameraValidationController] Transitioned -> Fall");
            }
            break;

        case PlatformCamValidationStep::Fall:
            if (m_stepTimer >= 0.05)
            {
                m_step = PlatformCamValidationStep::Stop;
                m_stepTimer = 0.0;
                LOG_INFO("[PlatformCameraValidationController] Transitioned -> Stop");
            }
            break;

        case PlatformCamValidationStep::Stop:
            moveSystem.stop(registry, m_character);
            if (m_stepTimer >= 0.05)
            {
                m_step = PlatformCamValidationStep::Reverse;
                m_stepTimer = 0.0;
                LOG_INFO("[PlatformCameraValidationController] Transitioned -> Reverse");
            }
            break;

        case PlatformCamValidationStep::Reverse:
            moveSystem.moveLeft(registry, m_character, 1.0f);
            m_cycleCount++;
            LOG_INFO("[PlatformCameraValidationController] Completed full camera validation cycle (Count: {}).", m_cycleCount);
            m_step = PlatformCamValidationStep::Repeat;
            m_stepTimer = 0.0;
            break;

        case PlatformCamValidationStep::Repeat:
            m_step = PlatformCamValidationStep::Walk;
            m_stepTimer = 0.0;
            break;
        }
    }
}
