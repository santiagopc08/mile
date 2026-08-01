#include "engine/gameplay/enemy/EnemySystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    EntityID EnemySystem::spawnEnemy(Registry &registry, EnemyType type, const glm::vec2 &position)
    {
        EntityID enemy = registry.CreateEntity("Enemy_" + std::to_string(m_nextEnemyID));
        
        auto &transform = registry.AddComponent<TransformComponent>(enemy);
        transform.Position = position;

        auto &comp = registry.AddComponent<EnemyComponent>(enemy);
        comp.id = m_nextEnemyID++;

        auto &settings = registry.AddComponent<EnemySettingsComponent>(enemy);
        settings.type = type;

        auto &runtime = registry.AddComponent<EnemyRuntimeComponent>(enemy);
        runtime.state = EnemyState::Idle;
        runtime.alive = true;
        runtime.active = true;

        m_enemyCount++;
        m_aliveCount++;

        LOG_INFO("[EnemySystem] Spawned enemy ID {} (Type: {}) at ({:.1f}, {:.1f}).",
                 comp.id, static_cast<int>(type), position.x, position.y);
        return enemy;
    }

    void EnemySystem::destroyEnemy(Registry &registry, EntityID enemyEntity)
    {
        auto *runtime = registry.GetComponent<EnemyRuntimeComponent>(enemyEntity);
        if (runtime && runtime->alive)
        {
            runtime->alive = false;
            runtime->state = EnemyState::Dead;
            if (m_aliveCount > 0) m_aliveCount--;
            LOG_INFO("[EnemySystem] Destroyed enemy entity #{}.", enemyEntity);
        }
    }

    void EnemySystem::enableEnemy(Registry &registry, EntityID enemyEntity)
    {
        auto *runtime = registry.GetComponent<EnemyRuntimeComponent>(enemyEntity);
        if (runtime)
        {
            runtime->active = true;
            runtime->state = EnemyState::Idle;
        }
    }

    void EnemySystem::disableEnemy(Registry &registry, EntityID enemyEntity)
    {
        auto *runtime = registry.GetComponent<EnemyRuntimeComponent>(enemyEntity);
        if (runtime)
        {
            runtime->active = false;
            runtime->state = EnemyState::Disabled;
        }
    }

    void EnemySystem::setTarget(Registry &registry, EntityID enemyEntity, EntityID targetEntity)
    {
        auto *runtime = registry.GetComponent<EnemyRuntimeComponent>(enemyEntity);
        if (runtime)
        {
            runtime->currentTarget = targetEntity;
            runtime->state = (targetEntity != kNullEntity) ? EnemyState::Alert : EnemyState::Idle;
        }
    }

    void EnemySystem::clearTarget(Registry &registry, EntityID enemyEntity)
    {
        setTarget(registry, enemyEntity, kNullEntity);
    }

    EnemyState EnemySystem::enemyState(Registry &registry, EntityID enemyEntity) const
    {
        auto *runtime = registry.GetComponent<EnemyRuntimeComponent>(enemyEntity);
        return runtime ? runtime->state : EnemyState::Disabled;
    }

    EntityID EnemySystem::currentTarget(Registry &registry, EntityID enemyEntity) const
    {
        auto *runtime = registry.GetComponent<EnemyRuntimeComponent>(enemyEntity);
        return runtime ? runtime->currentTarget : kNullEntity;
    }

    bool EnemySystem::isAlive(Registry &registry, EntityID enemyEntity) const
    {
        auto *runtime = registry.GetComponent<EnemyRuntimeComponent>(enemyEntity);
        return runtime ? runtime->alive : false;
    }

    EnemyType EnemySystem::enemyType(Registry &registry, EntityID enemyEntity) const
    {
        auto *settings = registry.GetComponent<EnemySettingsComponent>(enemyEntity);
        return settings ? settings->type : EnemyType::Walking;
    }

    SubsystemProfilerMetrics EnemySystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.08;
        metrics.memoryUsageBytes = sizeof(EnemyRuntimeComponent) * m_enemyCount;
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = m_enemyCount;
        metrics.lifetimeObjectsCreated = m_enemyCount;
        return metrics;
    }
}
