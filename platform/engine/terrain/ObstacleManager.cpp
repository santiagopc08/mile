#include "engine/terrain/ObstacleManager.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    EntityID ObstacleManager::spawnObstacle(Registry &registry, ObstacleType type, const glm::vec2 &position, uint32_t ownerChunk)
    {
        EntityID obstacle = registry.CreateEntity("Obstacle");
        auto &transform = registry.AddComponent<TransformComponent>(obstacle);
        transform.Position = position;

        auto &settings = registry.AddComponent<ObstacleSettingsComponent>(obstacle);
        settings.type = type;

        auto &runtime = registry.AddComponent<ObstacleRuntimeComponent>(obstacle);
        runtime.ownerChunk = ownerChunk;
        runtime.active = true;
        runtime.generated = true;

        m_obstacles[obstacle] = type;
        LOG_INFO("[ObstacleManager] Spawned obstacle entity #{} (Type: {}) at ({:.1f}, {:.1f}).",
                 obstacle, static_cast<int>(type), position.x, position.y);
        return obstacle;
    }

    void ObstacleManager::destroyObstacle(Registry &registry, EntityID obstacleEntity)
    {
        m_obstacles.erase(obstacleEntity);
        registry.DestroyEntity(obstacleEntity);
    }

    void ObstacleManager::registerObstacle(EntityID obstacleEntity, ObstacleType type)
    {
        m_obstacles[obstacleEntity] = type;
    }

    EntityID ObstacleManager::findObstacle(EntityID obstacleEntity) const
    {
        auto it = m_obstacles.find(obstacleEntity);
        return (it != m_obstacles.end()) ? it->first : kNullEntity;
    }
}
