#include "engine/level/dialogue/DialogueSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void DialogueSystem::startDialogue(Registry &registry, EntityID dialogueEntity, DialogueID id)
    {
        auto *settings = registry.GetComponent<DialogueSettingsComponent>(dialogueEntity);
        auto *runtime = registry.GetComponent<DialogueRuntimeComponent>(dialogueEntity);

        if (!settings) settings = &registry.AddComponent<DialogueSettingsComponent>(dialogueEntity);
        if (!runtime) runtime = &registry.AddComponent<DialogueRuntimeComponent>(dialogueEntity);

        settings->dialogueID = id;
        runtime->state = DialogueState::Active;
        runtime->currentNode = 0;
        runtime->currentText = "Greeting from dialogue ID " + std::to_string(id);
        LOG_INFO("[DialogueSystem] Started dialogue ID {} on entity #{}.", id, dialogueEntity);
    }

    bool DialogueSystem::advance(Registry &registry, EntityID dialogueEntity)
    {
        auto *runtime = registry.GetComponent<DialogueRuntimeComponent>(dialogueEntity);
        if (runtime && runtime->state == DialogueState::Active)
        {
            runtime->currentNode++;
            if (runtime->currentNode >= runtime->totalNodes)
            {
                runtime->state = DialogueState::Finished;
                LOG_INFO("[DialogueSystem] Dialogue finished on entity #{}.", dialogueEntity);
                return false;
            }
            runtime->currentText = "Dialogue node " + std::to_string(runtime->currentNode);
            return true;
        }
        return false;
    }

    void DialogueSystem::choose(Registry &registry, EntityID dialogueEntity, uint32_t optionIndex)
    {
        auto *runtime = registry.GetComponent<DialogueRuntimeComponent>(dialogueEntity);
        if (runtime && runtime->state == DialogueState::Choice)
        {
            runtime->state = DialogueState::Active;
            runtime->currentNode++;
            LOG_INFO("[DialogueSystem] Selected option {} on dialogue entity #{}.", optionIndex, dialogueEntity);
        }
    }

    void DialogueSystem::cancel(Registry &registry, EntityID dialogueEntity)
    {
        auto *runtime = registry.GetComponent<DialogueRuntimeComponent>(dialogueEntity);
        if (runtime)
        {
            runtime->state = DialogueState::Finished;
            LOG_INFO("[DialogueSystem] Cancelled dialogue on entity #{}.", dialogueEntity);
        }
    }

    DialogueState DialogueSystem::dialogueState(Registry &registry, EntityID dialogueEntity) const
    {
        auto *runtime = registry.GetComponent<DialogueRuntimeComponent>(dialogueEntity);
        return runtime ? runtime->state : DialogueState::Inactive;
    }

    uint32_t DialogueSystem::currentNode(Registry &registry, EntityID dialogueEntity) const
    {
        auto *runtime = registry.GetComponent<DialogueRuntimeComponent>(dialogueEntity);
        return runtime ? runtime->currentNode : 0;
    }

    std::string DialogueSystem::currentText(Registry &registry, EntityID dialogueEntity) const
    {
        auto *runtime = registry.GetComponent<DialogueRuntimeComponent>(dialogueEntity);
        return runtime ? runtime->currentText : "";
    }
}
