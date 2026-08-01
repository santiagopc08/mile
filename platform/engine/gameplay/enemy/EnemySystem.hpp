#ifndef PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_SYSTEM_HPP

#include "engine/gameplay/enemy/EnemySettingsComponent.hpp"
#include "engine/gameplay/enemy/EnemyRuntimeComponent.hpp"
#include "engine/gameplay/enemy/EnemyComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"
#include <glm/glm.hpp>

namespace platform
{
    class EnemySystem : public IRuntimeProfiler
    {
    public:
        EnemySystem() = default;

        EntityID spawnEnemy(Registry &registry, EnemyType type, const glm::vec2 &position);
        void destroyEnemy(Registry &registry, EntityID enemyEntity);

        void enableEnemy(Registry &registry, EntityID enemyEntity);
        void disableEnemy(Registry &registry, EntityID enemyEntity);

        void setTarget(Registry &registry, EntityID enemyEntity, EntityID targetEntity);
        void clearTarget(Registry &registry, EntityID enemyEntity);

        [[nodiscard]] EnemyState enemyState(Registry &registry, EntityID enemyEntity) const;
        [[nodiscard]] EntityID currentTarget(Registry &registry, EntityID enemyEntity) const;
        [[nodiscard]] bool isAlive(Registry &registry, EntityID enemyEntity) const;
        [[nodiscard]] EnemyType enemyType(Registry &registry, EntityID enemyEntity) const;

        [[nodiscard]] uint32_t enemyCount() const { return m_enemyCount; }
        [[nodiscard]] uint32_t aliveCount() const { return m_aliveCount; }

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;

    private:
        uint32_t m_enemyCount{0};
        uint32_t m_aliveCount{0};
        EnemyID m_nextEnemyID{1};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_SYSTEM_HPP
