#ifndef PLATFORM_ENGINE_CHARACTER_CHARACTER_SYSTEM_HPP
#define PLATFORM_ENGINE_CHARACTER_CHARACTER_SYSTEM_HPP

#include "engine/character/CharacterComponent.hpp"
#include "engine/character/CharacterSettingsComponent.hpp"
#include "engine/character/CharacterRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"
#include <glm/glm.hpp>
#include <unordered_map>
#include <optional>

namespace platform
{
    class CharacterSystem : public IRuntimeProfiler
    {
    public:
        CharacterSystem() = default;

        EntityID spawnCharacter(Registry &registry, CharacterID id, CharacterType type, const glm::vec2 &position, const CharacterSettingsComponent &settings = {});
        void destroyCharacter(Registry &registry, EntityID characterEntity);

        void enableCharacter(Registry &registry, EntityID characterEntity);
        void disableCharacter(Registry &registry, EntityID characterEntity);

        EntityID getCharacter(CharacterID id) const;

        [[nodiscard]] bool isGrounded(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] glm::vec2 velocity(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] CharacterState currentState(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] CharacterType characterType(Registry &registry, EntityID characterEntity) const;

        [[nodiscard]] size_t characterCount() const { return m_characters.size(); }

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;

    private:
        std::unordered_map<CharacterID, EntityID> m_characters;
        uint64_t m_lifetimeSpawns{0};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_CHARACTER_SYSTEM_HPP
