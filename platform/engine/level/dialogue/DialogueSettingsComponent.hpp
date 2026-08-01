#ifndef PLATFORM_ENGINE_LEVEL_DIALOGUE_DIALOGUE_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_DIALOGUE_DIALOGUE_SETTINGS_COMPONENT_HPP

#include <string>

namespace platform
{
    using DialogueID = uint32_t;

    struct DialogueSettingsComponent
    {
        DialogueID dialogueID{1};
        std::string title{"Intro Dialogue"};
        bool skippable{true};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_DIALOGUE_DIALOGUE_SETTINGS_COMPONENT_HPP
