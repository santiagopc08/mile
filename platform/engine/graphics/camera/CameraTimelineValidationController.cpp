#include "engine/graphics/camera/CameraTimelineValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void CameraTimelineValidationController::Initialize()
    {
        m_step = CameraTimelineValidationStep::MoveCamera;
        m_camEntity = kNullEntity;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[CameraTimelineValidationController] Initialized autonomous camera timeline validation sequence.");
    }

    std::string CameraTimelineValidationController::GetStateName() const
    {
        switch (m_step)
        {
        case CameraTimelineValidationStep::MoveCamera: return "MoveCamera";
        case CameraTimelineValidationStep::Zoom: return "Zoom";
        case CameraTimelineValidationStep::Shake: return "Shake";
        case CameraTimelineValidationStep::FollowCharacter: return "FollowCharacter";
        case CameraTimelineValidationStep::Restore: return "Restore";
        case CameraTimelineValidationStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void CameraTimelineValidationController::Update(Registry &registry, CameraTimelineSystem &camSystem, double dt)
    {
        if (m_camEntity == kNullEntity)
        {
            m_camEntity = registry.CreateEntity("CameraTimelineEntity");
            auto *settings = registry.GetComponent<CameraTimelineSettingsComponent>(m_camEntity);
            if (!settings) settings = &registry.AddComponent<CameraTimelineSettingsComponent>(m_camEntity);

            settings->keyframes = {
                { 0.0, {0.0f, 0.0f}, 1.0f, 0.0f, 0.0f, CameraInterpolation::Linear },
                { 0.5, {10.0f, 5.0f}, 1.5f, 0.0f, 0.2f, CameraInterpolation::SmoothStep },
                { 1.0, {0.0f, 0.0f}, 1.0f, 0.0f, 0.0f, CameraInterpolation::Linear }
            };
            settings->duration = 1.0;
        }

        m_stepTimer += dt;

        switch (m_step)
        {
        case CameraTimelineValidationStep::MoveCamera:
            camSystem.playCameraTimeline(registry, m_camEntity);
            camSystem.Update(registry, 0.2);
            m_step = CameraTimelineValidationStep::Zoom;
            m_stepTimer = 0.0;
            LOG_INFO("[CameraTimelineValidationController] Transitioned -> Zoom");
            break;

        case CameraTimelineValidationStep::Zoom:
            camSystem.Update(registry, 0.3);
            m_step = CameraTimelineValidationStep::Shake;
            m_stepTimer = 0.0;
            LOG_INFO("[CameraTimelineValidationController] Transitioned -> Shake");
            break;

        case CameraTimelineValidationStep::Shake:
            camSystem.Update(registry, 0.2);
            m_step = CameraTimelineValidationStep::FollowCharacter;
            m_stepTimer = 0.0;
            LOG_INFO("[CameraTimelineValidationController] Transitioned -> FollowCharacter");
            break;

        case CameraTimelineValidationStep::FollowCharacter:
            camSystem.Update(registry, 0.3);
            m_step = CameraTimelineValidationStep::Restore;
            m_stepTimer = 0.0;
            LOG_INFO("[CameraTimelineValidationController] Transitioned -> Restore");
            break;

        case CameraTimelineValidationStep::Restore:
            camSystem.stopCameraTimeline(registry, m_camEntity);
            m_cycleCount++;
            LOG_INFO("[CameraTimelineValidationController] Completed full camera timeline validation cycle (Count: {}).", m_cycleCount);
            m_step = CameraTimelineValidationStep::Repeat;
            m_stepTimer = 0.0;
            break;

        case CameraTimelineValidationStep::Repeat:
            m_step = CameraTimelineValidationStep::MoveCamera;
            m_stepTimer = 0.0;
            break;
        }
    }
}
