#ifndef PLATFORM_ENGINE_WORLD_INTERACTIVE_INTERACTIVE_OBJECT_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_WORLD_INTERACTIVE_INTERACTIVE_OBJECT_SETTINGS_COMPONENT_HPP

#include <string>

namespace platform
{
    enum class InteractionType
    {
        CoinBlock,
        MysteryBlock,
        Switch,
        Lever,
        Button,
        PressurePlate
    };

    struct InteractiveObjectSettingsComponent
    {
        InteractionType type{InteractionType::MysteryBlock};
        bool repeatable{false};
        bool enabled{true};
        std::string rewardAsset{"Coin"};
    };
}

#endif // PLATFORM_ENGINE_WORLD_INTERACTIVE_INTERACTIVE_OBJECT_SETTINGS_COMPONENT_HPP
