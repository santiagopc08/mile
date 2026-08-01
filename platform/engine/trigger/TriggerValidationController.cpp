#include "engine/trigger/TriggerValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void TriggerValidationController::Initialize()
    {
        m_step = TriggerValidationStep::LoadTimeline;
        m_triggerA = kNullEntity;
        m_triggerB = kNullEntity;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[TriggerValidationController] Initialized autonomous trigger framework validation sequence.");
    }

    std::string TriggerValidationController::GetStateName() const
    {
        switch (m_step)
        {
        case TriggerValidationStep::LoadTimeline: return "LoadTimeline";
        case TriggerValidationStep::ExecuteTriggerA: return "ExecuteTriggerA";
        case TriggerValidationStep::ExecuteTriggerB: return "ExecuteTriggerB";
        case TriggerValidationStep::ExecuteSimultaneousTriggers: return "ExecuteSimultaneousTriggers";
        case TriggerValidationStep::Restart: return "Restart";
        case TriggerValidationStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void TriggerValidationController::Update(Registry &registry, TriggerSystem &triggerSystem, double dt)
    {
        if (m_triggerA == kNullEntity)
        {
            m_triggerA = registry.CreateEntity("Trigger_A");
            m_triggerB = registry.CreateEntity("Trigger_B");
            triggerSystem.registerTrigger(registry, m_triggerA, 1, TriggerCondition::Once, TriggerAction::PublishRuntimeEvent);
            triggerSystem.registerTrigger(registry, m_triggerB, 2, TriggerCondition::Repeat, TriggerAction::PlayEffect);
        }

        m_stepTimer += dt;

        switch (m_step)
        {
        case TriggerValidationStep::LoadTimeline:
            m_step = TriggerValidationStep::ExecuteTriggerA;
            m_stepTimer = 0.0;
            LOG_INFO("[TriggerValidationController] Transitioned -> ExecuteTriggerA");
            break;

        case TriggerValidationStep::ExecuteTriggerA:
            triggerSystem.fire(registry, m_triggerA, 10);
            m_step = TriggerValidationStep::ExecuteTriggerB;
            m_stepTimer = 0.0;
            LOG_INFO("[TriggerValidationController] Transitioned -> ExecuteTriggerB");
            break;

        case TriggerValidationStep::ExecuteTriggerB:
            triggerSystem.fire(registry, m_triggerB, 20);
            m_step = TriggerValidationStep::ExecuteSimultaneousTriggers;
            m_stepTimer = 0.0;
            LOG_INFO("[TriggerValidationController] Transitioned -> ExecuteSimultaneousTriggers");
            break;

        case TriggerValidationStep::ExecuteSimultaneousTriggers:
            triggerSystem.fire(registry, m_triggerB, 30);
            m_step = TriggerValidationStep::Restart;
            m_stepTimer = 0.0;
            LOG_INFO("[TriggerValidationController] Transitioned -> Restart");
            break;

        case TriggerValidationStep::Restart:
            triggerSystem.reset(registry, m_triggerA);
            triggerSystem.reset(registry, m_triggerB);
            m_cycleCount++;
            LOG_INFO("[TriggerValidationController] Completed full trigger validation cycle (Count: {}).", m_cycleCount);
            m_step = TriggerValidationStep::Repeat;
            m_stepTimer = 0.0;
            break;

        case TriggerValidationStep::Repeat:
            m_step = TriggerValidationStep::LoadTimeline;
            m_stepTimer = 0.0;
            break;
        }
    }
}
