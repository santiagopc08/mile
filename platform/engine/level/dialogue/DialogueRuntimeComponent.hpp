#ifndef PLATFORM_ENGINE_LEVEL_DIALOGUE_DIALOGUE_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_DIALOGUE_DIALOGUE_RUNTIME_COMPONENT_HPP

#include <cstdint>
#include <string>

namespace platform
{
    enum class DialogueState
    {
        Inactive,
        Active,
        Choice,
        Finished
    };

    struct DialogueRuntimeComponent
    {
        DialogueState state{DialogueState::Inactive};
        uint32_t currentNode{0};
        uint32_t totalNodes{3};
        std::string currentText{"It's dangerous to go alone!"};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_DIALOGUE_DIALOGUE_RUNTIME_COMPONENT_HPP
