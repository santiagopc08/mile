#include "engine/input/actions/ActionMap.hpp"

namespace platform
{
    ActionMap::ActionMap() = default;

    ActionMap ActionMap::CreateDefault()
    {
        ActionMap map;
        map.AddBinding(Key::A, InputAction::MoveLeft, Key::Left);
        map.AddBinding(Key::D, InputAction::MoveRight, Key::Right);
        map.AddBinding(Key::W, InputAction::MoveUp, Key::Up);
        map.AddBinding(Key::S, InputAction::MoveDown, Key::Down);
        map.AddBinding(Key::Enter, InputAction::Accept, Key::Space);
        map.AddBinding(Key::Escape, InputAction::Cancel);
        map.AddBinding(Key::P, InputAction::Pause);
        return map;
    }

    void ActionMap::AddBinding(Key primaryKey, InputAction action, Key secondaryKey)
    {
        InputBinding binding;
        binding.PrimaryKey = primaryKey;
        binding.SecondaryKey = secondaryKey;
        binding.Action = action;
        m_bindings.push_back(binding);
    }

    void ActionMap::ClearBindings()
    {
        m_bindings.clear();
    }
}
