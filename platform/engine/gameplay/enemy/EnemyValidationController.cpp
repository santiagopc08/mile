#include "engine/gameplay/enemy/EnemyValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void EnemyValidationController::Initialize()
    {
        m_step = EnemyValidationStep::Spawn;
        m_enemy = kNullEntity;
        m_player = kNullEntity;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[EnemyValidationController] Initialized autonomous enemy framework validation sequence.");
    }

    std::string EnemyValidationController::GetStateName() const
    {
        switch (m_step)
        {
        case EnemyValidationStep::Spawn: return "Spawn";
        case EnemyValidationStep::Enable: return "Enable";
        case EnemyValidationStep::AssignTarget: return "AssignTarget";
        case EnemyValidationStep::ClearTarget: return "ClearTarget";
        case EnemyValidationStep::Disable: return "Disable";
        case EnemyValidationStep::Destroy: return "Destroy";
        case EnemyValidationStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void EnemyValidationController::Update(Registry &registry, EnemySystem &enemySystem, double dt)
    {
        m_stepTimer += dt;

        if (m_player == kNullEntity)
        {
            m_player = registry.CreateEntity("PlayerTarget");
        }

        switch (m_step)
        {
        case EnemyValidationStep::Spawn:
            m_enemy = enemySystem.spawnEnemy(registry, EnemyType::Walking, {5.0f, 0.0f});
            m_step = EnemyValidationStep::Enable;
            m_stepTimer = 0.0;
            LOG_INFO("[EnemyValidationController] Transitioned -> Enable");
            break;

        case EnemyValidationStep::Enable:
            enemySystem.enableEnemy(registry, m_enemy);
            if (m_stepTimer >= 0.05)
            {
                m_step = EnemyValidationStep::AssignTarget;
                m_stepTimer = 0.0;
                LOG_INFO("[EnemyValidationController] Transitioned -> AssignTarget");
            }
            break;

        case EnemyValidationStep::AssignTarget:
            enemySystem.setTarget(registry, m_enemy, m_player);
            if (m_stepTimer >= 0.05)
            {
                m_step = EnemyValidationStep::ClearTarget;
                m_stepTimer = 0.0;
                LOG_INFO("[EnemyValidationController] Transitioned -> ClearTarget");
            }
            break;

        case EnemyValidationStep::ClearTarget:
            enemySystem.clearTarget(registry, m_enemy);
            if (m_stepTimer >= 0.05)
            {
                m_step = EnemyValidationStep::Disable;
                m_stepTimer = 0.0;
                LOG_INFO("[EnemyValidationController] Transitioned -> Disable");
            }
            break;

        case EnemyValidationStep::Disable:
            enemySystem.disableEnemy(registry, m_enemy);
            if (m_stepTimer >= 0.05)
            {
                m_step = EnemyValidationStep::Destroy;
                m_stepTimer = 0.0;
                LOG_INFO("[EnemyValidationController] Transitioned -> Destroy");
            }
            break;

        case EnemyValidationStep::Destroy:
            enemySystem.destroyEnemy(registry, m_enemy);
            m_cycleCount++;
            LOG_INFO("[EnemyValidationController] Completed full enemy validation cycle (Count: {}).", m_cycleCount);
            m_step = EnemyValidationStep::Repeat;
            m_stepTimer = 0.0;
            break;

        case EnemyValidationStep::Repeat:
            m_step = EnemyValidationStep::Spawn;
            m_stepTimer = 0.0;
            break;
        }
    }
}
