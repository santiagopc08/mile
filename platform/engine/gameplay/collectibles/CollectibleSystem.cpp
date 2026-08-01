#include "engine/gameplay/collectibles/CollectibleSystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    EntityID CollectibleSystem::spawnCollectible(Registry &registry, CollectibleType type, const glm::vec2 &position, float value)
    {
        EntityID item = registry.CreateEntity("Collectible");
        auto &transform = registry.AddComponent<TransformComponent>(item);
        transform.Position = position;

        auto &settings = registry.AddComponent<CollectibleSettingsComponent>(item);
        settings.type = type;
        settings.value = value;

        registry.AddComponent<CollectibleRuntimeComponent>(item);

        LOG_INFO("[CollectibleSystem] Spawned collectible entity #{} (Type: {}, Value: {:.1f}) at ({:.1f}, {:.1f}).",
                 item, static_cast<int>(type), value, position.x, position.y);
        return item;
    }

    void CollectibleSystem::collect(Registry &registry, EntityID collectibleEntity)
    {
        auto *runtime = registry.GetComponent<CollectibleRuntimeComponent>(collectibleEntity);
        if (runtime && !runtime->collected)
        {
            runtime->collected = true;
            runtime->collectedTime = 1.0;
            LOG_INFO("[CollectibleSystem] Collected item entity #{}.", collectibleEntity);
        }
    }

    void CollectibleSystem::destroyCollectible(Registry &registry, EntityID collectibleEntity)
    {
        registry.DestroyEntity(collectibleEntity);
    }

    void CollectibleSystem::resetCollectible(Registry &registry, EntityID collectibleEntity)
    {
        auto *runtime = registry.GetComponent<CollectibleRuntimeComponent>(collectibleEntity);
        if (runtime)
        {
            runtime->collected = false;
            runtime->collectedTime = 0.0;
        }
    }
}
