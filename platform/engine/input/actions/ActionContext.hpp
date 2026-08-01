#ifndef PLATFORM_ENGINE_INPUT_ACTIONS_ACTION_CONTEXT_HPP
#define PLATFORM_ENGINE_INPUT_ACTIONS_ACTION_CONTEXT_HPP

#include "engine/input/actions/ActionMap.hpp"
#include "engine/input/InputSnapshot.hpp"
#include <glm/glm.hpp>
#include <unordered_map>
#include <memory>

namespace platform
{
    class ActionContext
    {
    public:
        ActionContext();
        explicit ActionContext(ActionMap actionMap);

        void Update(const std::shared_ptr<const InputSnapshot> &snapshot);
        void SetActionMap(ActionMap actionMap) { m_actionMap = std::move(actionMap); }

        [[nodiscard]] bool IsActionTriggered(InputAction action) const;
        [[nodiscard]] bool IsActionHeld(InputAction action) const;
        [[nodiscard]] bool IsActionReleased(InputAction action) const;

        [[nodiscard]] glm::vec2 GetMovementVector() const;

    private:
        ActionMap m_actionMap;
        std::unordered_map<InputAction, ActionState> m_actionStates;
    };
}

#endif // PLATFORM_ENGINE_INPUT_ACTIONS_ACTION_CONTEXT_HPP
