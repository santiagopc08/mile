#ifndef PLATFORM_ENGINE_LEVEL_NPC_NPC_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_NPC_NPC_SETTINGS_COMPONENT_HPP

#include <string>

namespace platform
{
    enum class NPCType
    {
        Vendor,
        QuestGiver,
        Helper,
        Neutral,
        Story
    };

    struct NPCSettingsComponent
    {
        NPCType type{NPCType::QuestGiver};
        std::string defaultDialogue{"dialogue_intro"};
        bool interactable{true};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_NPC_NPC_SETTINGS_COMPONENT_HPP
