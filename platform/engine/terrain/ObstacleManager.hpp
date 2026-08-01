#ifndef PLATFORM_ENGINE_TERRAIN_OBSTACLE_MANAGER_HPP
#define PLATFORM_ENGINE_TERRAIN_OBSTACLE_MANAGER_HPP

#include "engine/terrain/ObstacleSettingsComponent.hpp"
#include "engine/terrain/ObstacleRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include <glm/glm.hpp>
#include <vector>
#include <unordered_map>

namespace platform
{
    class ObstacleManager
    {
    public:
        ObstacleManager() = default;

        EntityID spawnObstacle(Registry &registry, ObstacleType type, const glm::vec2 &position, uint32_t ownerChunk = 0);
        void destroyObstacle(Registry &registry, EntityID obstacleEntity);
        void registerObstacle(EntityID obstacleEntity, ObstacleType type);

        EntityID findObstacle(EntityID obstacleEntity) const;

        [[nodiscard]] size_t obstacleCount() const { return m_obstacles.size(); }

    private:
        std::unordered_map<EntityID, ObstacleType> m_obstacles;
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_OBSTACLE_MANAGER_HPP
