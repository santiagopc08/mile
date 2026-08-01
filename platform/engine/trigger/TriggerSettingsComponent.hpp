#ifndef PLATFORM_ENGINE_TRIGGER_TRIGGER_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_TRIGGER_TRIGGER_SETTINGS_COMPONENT_HPP

#include <cstdint>
#include <string>

namespace platform
{
    enum class TriggerCondition
    {
        Always,
        Once,
        Repeat,
        WhileTrue,
        Until,
        Probability
    };

    enum class TriggerType
    {
        Beat,
        Time,
        Collision,
        State,
        Area,
        Custom
    };

    enum class TriggerAction
    {
        SpawnEntity,
        DestroyEntity,
        ActivateObject,
        DeactivateObject,
        PlayAnimation,
        PlayEffect,
        PlayAudioEvent,
        PublishRuntimeEvent,
        ModifyGameplayVariable
    };

    struct TriggerSettingsComponent
    {
        uint32_t triggerID{0};
        TriggerCondition condition{TriggerCondition::Once};
        TriggerType type{TriggerType::Time};
        TriggerAction action{TriggerAction::PublishRuntimeEvent};
        uint32_t priority{0};
        uint32_t targetEntity{0};
        std::string parameters{};
        bool active{true};
    };
}

#endif // PLATFORM_ENGINE_TRIGGER_TRIGGER_SETTINGS_COMPONENT_HPP
