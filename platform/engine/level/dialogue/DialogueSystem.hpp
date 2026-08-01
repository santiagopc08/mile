#ifndef PLATFORM_ENGINE_LEVEL_DIALOGUE_DIALOGUE_SYSTEM_HPP
#define PLATFORM_ENGINE_LEVEL_DIALOGUE_DIALOGUE_SYSTEM_HPP

#include "engine/level/dialogue/DialogueSettingsComponent.hpp"
#include "engine/level/dialogue/DialogueRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class DialogueSystem
    {
    public:
        DialogueSystem() = default;

        void startDialogue(Registry &registry, EntityID dialogueEntity, DialogueID id);
        bool advance(Registry &registry, EntityID dialogueEntity);
        void choose(Registry &registry, EntityID dialogueEntity, uint32_t optionIndex);
        void cancel(Registry &registry, EntityID dialogueEntity);

        [[nodiscard]] DialogueState dialogueState(Registry &registry, EntityID dialogueEntity) const;
        [[nodiscard]] uint32_t currentNode(Registry &registry, EntityID dialogueEntity) const;
        [[nodiscard]] std::string currentText(Registry &registry, EntityID dialogueEntity) const;
    };
}

#endif // PLATFORM_ENGINE_LEVEL_DIALOGUE_DIALOGUE_SYSTEM_HPP
