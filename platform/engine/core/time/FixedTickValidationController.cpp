#include "engine/core/time/FixedTickValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void FixedTickValidationController::Initialize()
    {
        m_step = FixedTickValidationStep::FPS30;
        m_tickEntity = kNullEntity;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        m_baselineHash = 0;
        m_deterministicMatch = true;
        LOG_INFO("[FixedTickValidationController] Initialized autonomous fixed tick deterministic validation sequence.");
    }

    std::string FixedTickValidationController::GetStateName() const
    {
        switch (m_step)
        {
        case FixedTickValidationStep::FPS30: return "30 FPS";
        case FixedTickValidationStep::FPS60: return "60 FPS";
        case FixedTickValidationStep::FPS144: return "144 FPS";
        case FixedTickValidationStep::FPS240: return "240 FPS";
        case FixedTickValidationStep::RandomFPS: return "Random FPS";
        case FixedTickValidationStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void FixedTickValidationController::Update(Registry &registry, FixedTickSystem &tickSystem, double)
    {
        if (m_tickEntity == kNullEntity)
        {
            m_tickEntity = registry.CreateEntity("FixedTickController");
            auto *settings = registry.GetComponent<FixedTickSettingsComponent>(m_tickEntity);
            if (!settings) settings = &registry.AddComponent<FixedTickSettingsComponent>(m_tickEntity);
            settings->maxCatchUpTicks = 64; // Ensure validation testing does not drop ticks
        }

        switch (m_step)
        {
        case FixedTickValidationStep::FPS30:
            tickSystem.reset(registry, m_tickEntity);
            // Simulate 1.0s at 30 FPS (dt = 1/30)
            for (int i = 0; i < 30; ++i)
            {
                tickSystem.tick(registry, m_tickEntity, 1.0 / 30.0, nullptr);
            }
            m_baselineHash = tickSystem.deterministicHash(registry, m_tickEntity);
            LOG_INFO("[FixedTickValidationController] 30 FPS tick simulation baseline hash: {:#x}.", m_baselineHash);
            m_step = FixedTickValidationStep::FPS60;
            break;

        case FixedTickValidationStep::FPS60:
            tickSystem.reset(registry, m_tickEntity);
            // Simulate 1.0s at 60 FPS (dt = 1/60)
            for (int i = 0; i < 60; ++i)
            {
                tickSystem.tick(registry, m_tickEntity, 1.0 / 60.0, nullptr);
            }
            if (tickSystem.deterministicHash(registry, m_tickEntity) != m_baselineHash) m_deterministicMatch = false;
            m_step = FixedTickValidationStep::FPS144;
            break;

        case FixedTickValidationStep::FPS144:
            tickSystem.reset(registry, m_tickEntity);
            // Simulate 1.0s at 144 FPS (dt = 1/144)
            for (int i = 0; i < 144; ++i)
            {
                tickSystem.tick(registry, m_tickEntity, 1.0 / 144.0, nullptr);
            }
            if (tickSystem.deterministicHash(registry, m_tickEntity) != m_baselineHash) m_deterministicMatch = false;
            m_step = FixedTickValidationStep::FPS240;
            break;

        case FixedTickValidationStep::FPS240:
            tickSystem.reset(registry, m_tickEntity);
            // Simulate 1.0s at 240 FPS (dt = 1/240)
            for (int i = 0; i < 240; ++i)
            {
                tickSystem.tick(registry, m_tickEntity, 1.0 / 240.0, nullptr);
            }
            if (tickSystem.deterministicHash(registry, m_tickEntity) != m_baselineHash) m_deterministicMatch = false;
            m_step = FixedTickValidationStep::RandomFPS;
            break;

        case FixedTickValidationStep::RandomFPS:
            tickSystem.reset(registry, m_tickEntity);
            // Simulate variable rendering delta times accumulating to 1.0s
            tickSystem.tick(registry, m_tickEntity, 0.2, nullptr);
            tickSystem.tick(registry, m_tickEntity, 0.3, nullptr);
            tickSystem.tick(registry, m_tickEntity, 0.5, nullptr);
            if (tickSystem.deterministicHash(registry, m_tickEntity) != m_baselineHash) m_deterministicMatch = false;
            
            m_cycleCount++;
            LOG_INFO("[FixedTickValidationController] Completed fixed tick deterministic validation sequence. Match: {}.",
                     m_deterministicMatch ? "PASSED" : "FAILED");
            m_step = FixedTickValidationStep::Repeat;
            break;

        case FixedTickValidationStep::Repeat:
            m_step = FixedTickValidationStep::FPS30;
            break;
        }
    }
}
