#include "engine/character/CharacterSystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    EntityID CharacterSystem::spawnCharacter(Registry &registry, CharacterID id, CharacterType type, const glm::vec2 &position, const CharacterSettingsComponent &settings)
    {
        EntityID entity = registry.CreateEntity("Character_" + std::to_string(id));
        auto &transform = registry.AddComponent<TransformComponent>(entity);
        transform.Position = position;

        auto &charComp = registry.AddComponent<CharacterComponent>(entity);
        charComp.id = id;
        charComp.type = type;

        registry.AddComponent<CharacterSettingsComponent>(entity) = settings;

        auto &runtime = registry.AddComponent<CharacterRuntimeComponent>(entity);
        runtime.state = CharacterState::Active;
        runtime.grounded = true;
        runtime.enabled = true;
        runtime.velocity = {0.0f, 0.0f};

        auto &rbComp = registry.AddComponent<RigidBodyComponent>(entity);
        rbComp.Type = BodyType::Dynamic;
        rbComp.FixedRotation = !settings.canRotate;
        rbComp.GravityScale = settings.gravityScale;

        m_characters[id] = entity;
        m_lifetimeSpawns++;

        LOG_INFO("[CharacterSystem] Spawned character ID {} (Type: {}) at ({:.1f}, {:.1f}).",
                 id, static_cast<int>(type), position.x, position.y);
        return entity;
    }

    void CharacterSystem::destroyCharacter(Registry &registry, EntityID characterEntity)
    {
        auto *charComp = registry.GetComponent<CharacterComponent>(characterEntity);
        if (charComp)
        {
            m_characters.erase(charComp->id);
        }
        registry.DestroyEntity(characterEntity);
    }

    void CharacterSystem::enableCharacter(Registry &registry, EntityID characterEntity)
    {
        auto *runtime = registry.GetComponent<CharacterRuntimeComponent>(characterEntity);
        auto *settings = registry.GetComponent<CharacterSettingsComponent>(characterEntity);
        if (runtime && settings)
        {
            runtime->enabled = true;
            settings->enabled = true;
            runtime->state = CharacterState::Active;
            LOG_INFO("[CharacterSystem] Enabled character entity #{}.", characterEntity);
        }
    }

    void CharacterSystem::disableCharacter(Registry &registry, EntityID characterEntity)
    {
        auto *runtime = registry.GetComponent<CharacterRuntimeComponent>(characterEntity);
        auto *settings = registry.GetComponent<CharacterSettingsComponent>(characterEntity);
        if (runtime && settings)
        {
            runtime->enabled = false;
            settings->enabled = false;
            runtime->state = CharacterState::Disabled;
            LOG_INFO("[CharacterSystem] Disabled character entity #{}.", characterEntity);
        }
    }

    EntityID CharacterSystem::getCharacter(CharacterID id) const
    {
        auto it = m_characters.find(id);
        return (it != m_characters.end()) ? it->second : kNullEntity;
    }

    bool CharacterSystem::isGrounded(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<CharacterRuntimeComponent>(characterEntity);
        return runtime ? runtime->grounded : false;
    }

    glm::vec2 CharacterSystem::velocity(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<CharacterRuntimeComponent>(characterEntity);
        return runtime ? runtime->velocity : glm::vec2{0.0f, 0.0f};
    }

    CharacterState CharacterSystem::currentState(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<CharacterRuntimeComponent>(characterEntity);
        return runtime ? runtime->state : CharacterState::Destroyed;
    }

    CharacterType CharacterSystem::characterType(Registry &registry, EntityID characterEntity) const
    {
        auto *charComp = registry.GetComponent<CharacterComponent>(characterEntity);
        return charComp ? charComp->type : CharacterType::Player;
    }

    SubsystemProfilerMetrics CharacterSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.05;
        metrics.memoryUsageBytes = m_characters.size() * sizeof(EntityID);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = static_cast<uint32_t>(m_characters.size());
        metrics.lifetimeObjectsCreated = m_lifetimeSpawns;
        return metrics;
    }
}
