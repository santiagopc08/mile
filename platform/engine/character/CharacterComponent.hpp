#ifndef PLATFORM_ENGINE_CHARACTER_CHARACTER_COMPONENT_HPP
#define PLATFORM_ENGINE_CHARACTER_CHARACTER_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    using CharacterID = uint32_t;

    enum class CharacterType
    {
        Player,
        NPC,
        Enemy,
        Boss
    };

    struct CharacterComponent
    {
        CharacterID id{0};
        CharacterType type{CharacterType::Player};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_CHARACTER_COMPONENT_HPP
