#include "engine/input/actions/ActionContext.hpp"

namespace platform
{
    ActionContext::ActionContext()
        : m_actionMap(ActionMap::CreateDefault())
    {
    }

    ActionContext::ActionContext(ActionMap actionMap)
        : m_actionMap(std::move(actionMap))
    {
    }

    void ActionContext::Update(const std::shared_ptr<const InputSnapshot> &snapshot)
    {
        if (!snapshot)
        {
            return;
        }

        for (const auto &binding : m_actionMap.GetBindings())
        {
            ButtonState primaryState = snapshot->GetKeyState(binding.PrimaryKey);
            ButtonState secondaryState = (binding.SecondaryKey != Key::Unknown)
                ? snapshot->GetKeyState(binding.SecondaryKey)
                : ButtonState::Idle;

            // Combine state from primary and secondary bindings
            ButtonState activeState = (primaryState != ButtonState::Idle) ? primaryState : secondaryState;

            ActionState state = ActionState::Started;
            switch (activeState)
            {
            case ButtonState::Pressed:
                state = ActionState::Triggered;
                break;
            case ButtonState::Held:
                state = ActionState::Held;
                break;
            case ButtonState::Released:
                state = ActionState::Released;
                break;
            default:
                state = ActionState::Started; // Idle
                break;
            }

            m_actionStates[binding.Action] = state;
        }
    }

    bool ActionContext::IsActionTriggered(InputAction action) const
    {
        auto it = m_actionStates.find(action);
        return it != m_actionStates.end() && it->second == ActionState::Triggered;
    }

    bool ActionContext::IsActionHeld(InputAction action) const
    {
        auto it = m_actionStates.find(action);
        return it != m_actionStates.end() && (it->second == ActionState::Held || it->second == ActionState::Triggered);
    }

    bool ActionContext::IsActionReleased(InputAction action) const
    {
        auto it = m_actionStates.find(action);
        return it != m_actionStates.end() && it->second == ActionState::Released;
    }

    glm::vec2 ActionContext::GetMovementVector() const
    {
        glm::vec2 movement{0.0f, 0.0f};

        if (IsActionHeld(InputAction::MoveLeft))
        {
            movement.x -= 1.0f;
        }
        if (IsActionHeld(InputAction::MoveRight))
        {
            movement.x += 1.0f;
        }
        if (IsActionHeld(InputAction::MoveUp))
        {
            movement.y -= 1.0f;
        }
        if (IsActionHeld(InputAction::MoveDown))
        {
            movement.y += 1.0f;
        }

        if (glm::length(movement) > 0.0f)
        {
            movement = glm::normalize(movement);
        }

        return movement;
    }
}
